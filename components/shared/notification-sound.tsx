'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { getMyUnreadNotifications } from '@/lib/actions/notifications';
import { resolveNotificationUrl } from '@/lib/notification-route';
import { AlertToast, ALERT_DURATION_MS } from '@/components/shared/alert-toast';

/**
 * System-wide notification sound.
 *
 * Mount <NotificationSound /> once inside every authenticated shell (owner,
 * reception, waiter, superadmin). It polls the current user's unread
 * notifications and rings an audible chime + shows a toast whenever a NEW one
 * arrives — so notifications are heard on every page, for every role.
 *
 * A module-level, ref-counted singleton drives a single polling loop no matter
 * how many <NotificationSound /> instances are mounted (e.g. a shell plus a
 * nested header), so it never double-rings or double-polls.
 *
 * De-duplication: a per-user "watermark" (the newest notification timestamp we
 * have already alerted for) is persisted in localStorage, so reloads and
 * client-side navigations don't replay old alerts. On a user's very first load
 * we baseline the watermark to the server's current time, so the pre-existing
 * backlog stays silent — only notifications that arrive afterwards ring.
 *
 * It deliberately does NOT mark notifications read: the notification bell stays
 * the source of truth for unread state; the sound is purely an alert.
 */

const POLL_INTERVAL_MS = 10_000;

let refCount = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;

// Per-user alert state (reset when the active portal user changes).
let currentUserId: string | null = null;
let watermark: number | null = null; // epoch ms of newest notification already alerted
const rungIds = new Set<string>();

// Shared Web Audio context, unlocked on the first user gesture so the ring can
// actually play under browser autoplay policies.
let audioCtx: AudioContext | null = null;
let audioUnlockBound = false;

function watermarkKey(userId: string) {
  return `resthru:notif-watermark:${userId}`;
}

function loadWatermark(userId: string): number | null {
  try {
    const v = localStorage.getItem(watermarkKey(userId));
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

function saveWatermark(userId: string, ms: number) {
  try {
    localStorage.setItem(watermarkKey(userId), String(ms));
  } catch {
    // localStorage may be unavailable (private mode) — dedupe still works
    // in-memory for the current session via `rungIds`.
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

/** True when the browser's autoplay policy is still blocking the chime. */
export function isAudioBlocked(): boolean {
  const ctx = audioCtx;
  return !ctx || ctx.state !== 'running';
}

/**
 * Unlocks audio. Browsers only allow an AudioContext to start from inside a
 * real user gesture, so this must be called from a click/keypress handler.
 * Playing a zero-volume blip in the same tick is what actually flips Safari/iOS
 * out of the suspended state.
 */
export function unlockAudio(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(false);
  const kick = () => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.01);
    } catch {
      // ignore — the resume() below is what matters most
    }
  };
  if (ctx.state === 'running') {
    return Promise.resolve(true);
  }
  return ctx
    .resume()
    .then(() => {
      kick();
      return ctx.state === 'running';
    })
    .catch(() => false);
}

/** Resume/create the AudioContext on the user's first interaction. */
function bindAudioUnlock() {
  if (audioUnlockBound || typeof window === 'undefined') return;
  audioUnlockBound = true;
  const unlock = () => {
    unlockAudio().then((ok) => {
      // Keep listening until audio is genuinely running — the first gesture
      // can land while the context is still initialising.
      if (ok) {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      }
    });
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

/**
 * Plays a clear two-tone "ding-dong" ring.
 * Returns false when the browser's autoplay policy silently swallowed it, so
 * the caller can offer the user a way to switch sound on.
 */
function playRing(): boolean {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    // A suspended context accepts the scheduling calls below but emits nothing.
    if (ctx.state !== 'running') return false;

    const base = ctx.currentTime;
    const tone = (freq: number, offset: number, duration = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, base + offset);
      gain.gain.setValueAtTime(0.0001, base + offset);
      gain.gain.exponentialRampToValueAtTime(0.16, base + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, base + offset + duration);
      osc.start(base + offset);
      osc.stop(base + offset + duration + 0.02);
    };
    tone(880, 0);      // ding
    tone(1174.66, 0.18); // dong (a fourth up)
    return true;
  } catch {
    // Ignore — never let a failed chime break the app.
    return false;
  }
}

async function poll() {
  let result: Awaited<ReturnType<typeof getMyUnreadNotifications>>;
  try {
    result = await getMyUnreadNotifications();
  } catch {
    return; // transient/network error — try again next tick
  }

  const { userId, serverNow, notifications } = result;

  // Signed out on this portal — reset so a later sign-in re-baselines cleanly.
  if (!userId) {
    currentUserId = null;
    watermark = null;
    rungIds.clear();
    return;
  }

  // Active user changed (different portal / re-login) — reload their state.
  if (userId !== currentUserId) {
    currentUserId = userId;
    rungIds.clear();
    watermark = loadWatermark(userId);
  }

  // First time we've ever seen this user with no stored history: baseline to
  // the server's clock so the existing backlog stays silent. Only notifications
  // created after this moment will ring.
  if (watermark === null) {
    watermark = serverNow;
    saveWatermark(userId, watermark);
    return;
  }

  const fresh = notifications
    .map((n) => ({ ...n, ts: new Date(n.createdAt).getTime() }))
    .filter((n) => n.ts > (watermark as number) && !rungIds.has(n.id))
    .sort((a, b) => a.ts - b.ts);

  if (fresh.length === 0) return;

  fresh.forEach((n) => rungIds.add(n.id));
  watermark = Math.max(watermark, ...fresh.map((n) => n.ts));
  saveWatermark(userId, watermark);

  // One ring for the whole batch, plus a toast per notification.
  const rang = playRing();
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([150, 80, 150]);
  }
  fresh.forEach((n) => {
    const actionUrl = resolveNotificationUrl(n);
    // The very first alert in a tab often can't make a sound: browsers block
    // audio until the user has interacted with the page. Rather than fail
    // silently, offer to switch it on straight from the popup.
    const needsSoundOptIn = !rang;

    toast.custom(
      (id) => (
        <AlertToast
          toastId={id}
          title={n.title}
          message={n.message}
          actionUrl={actionUrl}
          actionLabel={n.relatedEntityType === 'Order' ? 'View Order' : 'View'}
          onEnableSound={
            needsSoundOptIn
              ? () => {
                  unlockAudio().then((ok) => {
                    toast.dismiss(id);
                    if (ok) {
                      playRing();
                      toast.success('Notification sound enabled');
                    } else {
                      toast.error('Your browser blocked audio for this site');
                    }
                  });
                }
              : undefined
          }
        />
      ),
      { duration: ALERT_DURATION_MS }
    );
  });
}

function startPolling() {
  refCount += 1;
  if (pollTimer !== null) return; // already running
  bindAudioUnlock();
  poll(); // fire immediately so a fresh page baselines/alerts without waiting
  pollTimer = setInterval(poll, POLL_INTERVAL_MS);
}

function stopPolling() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function NotificationSound() {
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, []);
  return null;
}

export default NotificationSound;
