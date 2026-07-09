import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getReadyOrderNotifications, markNotificationsRead } from '@/lib/actions/orders';

const POLL_INTERVAL_MS = 10_000; // match kitchen polling cadence

/**
 * Plays a soft two-tone chime using the Web Audio API.
 * Falls back silently if the browser doesn't allow audio.
 */
function playReadyChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    };
    // Two ascending tones: pleasant "ding-dong" effect
    playTone(880, ctx.currentTime);
    playTone(1100, ctx.currentTime + 0.25);
  } catch {
    // Silently ignore if audio context is unavailable
  }
}

/**
 * Polls for ORDER_READY notifications every 10 s and fires a sonner toast
 * for each new one, then marks them as read to avoid repeat alerts.
 *
 * Mount this hook once inside a client component on the /order page
 * (currently wired into OrderHeader.tsx).
 */
export function useReadyNotifications() {
  // Track IDs already shown so rapid re-renders don't double-fire toasts
  const shownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const check = async () => {
      const result = await getReadyOrderNotifications();
      if (result.error || !result.data || result.data.length === 0) return;

      const fresh = result.data.filter((n) => !shownIds.current.has(n.id));
      if (fresh.length === 0) return;

      // Play chime once for the batch
      playReadyChime();

      // Vibrate on mobile (if supported)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 80, 150]);
      }

      // Fire one toast per notification
      fresh.forEach((n) => {
        shownIds.current.add(n.id);
        toast.success(n.title, {
          description: n.message,
          duration: 8000,
          // Keep the toast visible until dismissed for important alerts
          closeButton: true,
        });
      });

      // Mark them read in the background so they don't reappear
      markNotificationsRead(fresh.map((n) => n.id));
    };

    // Run immediately on mount, then on each interval tick
    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
}
