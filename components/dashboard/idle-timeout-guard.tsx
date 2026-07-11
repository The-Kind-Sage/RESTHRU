'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

// Cashier terminals sit in a shared, publicly-visible area — an unattended,
// still-logged-in session is the easiest way to lose money or leak guest
// data. Warn well before logging out so a busy cashier doesn't get dropped
// mid-transaction.
const IDLE_WARNING_MS = 4 * 60 * 1000; // warn after 4 minutes idle
const IDLE_LOGOUT_MS = 5 * 60 * 1000; // auto-logout after 5 minutes idle
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

export default function IdleTimeoutGuard() {
  const { isAuthenticated, logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  }, []);

  const arm = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    warnTimer.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(Math.round((IDLE_LOGOUT_MS - IDLE_WARNING_MS) / 1000));
      countdownInterval.current = setInterval(() => {
        setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }, IDLE_WARNING_MS);
    logoutTimer.current = setTimeout(() => {
      logout();
    }, IDLE_LOGOUT_MS);
  }, [clearTimers, logout]);

  const handleActivity = useCallback(() => {
    // Once the warning dialog is up, only the "I'm still here" button
    // should dismiss it — otherwise a stray mouse jiggle near an unattended
    // terminal would silently keep the session alive.
    if (showWarning) return;
    arm();
  }, [arm, showWarning]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }
    arm();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, showWarning]);

  const stayLoggedIn = () => {
    setShowWarning(false);
    arm();
  };

  if (!isAuthenticated) return null;

  return (
    <Dialog open={showWarning}>
      <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            Still there?
          </DialogTitle>
          <DialogDescription>
            You'll be signed out in {secondsLeft}s for inactivity to keep this terminal secure.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => logout()}>Sign out now</Button>
          <Button onClick={stayLoggedIn}>I'm still here</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
