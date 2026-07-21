'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { getMyUnreadNotifications } from '@/lib/actions/notifications';

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

/** Resume/create the AudioContext on the user's first interaction. */
function bindAudioUnlock() {
  if (audioUnlockBound || typeof window === 'undefined') return;
  audioUnlockBound = true;
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

/** Plays a clear two-tone "ding-dong" ring. Silent if audio is unavailable. */
function playRing() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

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
  } catch {
    // Ignore — never let a failed chime break the app.
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
  playRing();
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([150, 80, 150]);
  }
  fresh.forEach((n) => {
    toast(n.title, {
      description: n.message,
      duration: 8000,
      closeButton: true,
    });
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
