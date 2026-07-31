'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { X, Volume2, Bike } from 'lucide-react';

export const ALERT_DURATION_MS = 8000;

/**
 * The app's standard alert card: coloured icon tile, title, message, an action
 * button, a dismiss, and a countdown bar.
 *
 * Shared by the live notification poller and the order-confirmation toast so
 * every "something happened" popup looks the same — a plain sonner toast next
 * to one of these reads as two different systems.
 */
export function AlertToast({
  toastId,
  title,
  message,
  actionUrl,
  actionLabel = 'View',
  icon,
  onEnableSound,
}: {
  toastId: string | number;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string;
  icon?: React.ReactNode;
  onEnableSound?: () => void;
}) {
  const router = useRouter();
  // Drive the countdown bar with a plain width transition so it needs no
  // global keyframes: full width on mount, then animate to zero.
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setElapsed(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const go = () => {
    if (!actionUrl) return;
    toast.dismiss(toastId);
    router.push(actionUrl);
  };

  return (
    <div
      onClick={actionUrl ? go : undefined}
      className={`relative w-[380px] max-w-[92vw] overflow-hidden rounded-xl border border-black/5 bg-white shadow-lg ${
        actionUrl ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          {icon ?? <Bike className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{title}</p>
          <p className="truncate text-sm text-gray-500">{message}</p>
        </div>

        {onEnableSound ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnableSound();
            }}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Volume2 className="h-4 w-4" /> Enable sound
          </button>
        ) : actionUrl ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              go();
            }}
            className="flex-shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {actionLabel}
          </button>
        ) : null}

        <button
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(toastId);
          }}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Countdown bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-blue-600"
        style={{
          width: elapsed ? '0%' : '100%',
          transition: `width ${ALERT_DURATION_MS}ms linear`,
        }}
      />
    </div>
  );
}

/** Convenience wrapper: raises an AlertToast without the toast.custom boilerplate. */
export function showAlertToast(opts: {
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string;
  icon?: React.ReactNode;
}) {
  toast.custom(
    (id) => (
      <AlertToast
        toastId={id}
        title={opts.title}
        message={opts.message}
        actionUrl={opts.actionUrl}
        actionLabel={opts.actionLabel}
        icon={opts.icon}
      />
    ),
    { duration: ALERT_DURATION_MS }
  );
}

export default AlertToast;
