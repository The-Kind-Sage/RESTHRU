'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { googleLogin } from '@/lib/actions/google-auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            ux_mode?: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// ── Module-level singleton ──
// GIS script + initialize() must run exactly once. We use a module-level
// callback that `initialize()` references so every component instance is
// reached without re-initializing.
type GisCallback = (response: { credential: string }) => void;
let globalGisCallback: GisCallback = () => {};
let gisReadyPromise: Promise<void> | null = null;

function ensureGisLoaded(clientId: string): Promise<void> {
  if (gisReadyPromise) return gisReadyPromise;

  gisReadyPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    const init = () => {
      console.log('[GIS] Initializing with client_id:', clientId, 'origin:', window.location.origin);
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => globalGisCallback(response),
        ux_mode: 'popup',
        error_callback: (error: any) => {
          console.error('[GIS] Error:', error);
          if (error?.type === 'idpiframe_initialization_failed' || error?.message?.includes?.('origin is not allowed')) {
            console.warn('[GIS] The current origin is not authorized. Add', window.location.origin, 'to Authorized JavaScript origins in Google Cloud Console.');
          }
        },
      });
      resolve();
    };

    if (existing && window.google) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  });

  return gisReadyPromise;
}

interface GoogleUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
  disabled?: boolean;
  redirectTo?: string;
  onSuccess?: (user: GoogleUser & { hasRestaurant?: boolean; restaurant?: any }) => void;
}

export function GoogleSignInButton({
  text = 'Signup or Login using Google',
  className = '',
  disabled = false,
  redirectTo,
  onSuccess,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(!!gisReadyPromise);
  const onSuccessRef = useRef(onSuccess);
  const redirectToRef = useRef(redirectTo);

  onSuccessRef.current = onSuccess;
  redirectToRef.current = redirectTo;

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setIsLoading(true);
    try {
      const result = await googleLogin(response.credential);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result.user && onSuccessRef.current) {
        onSuccessRef.current({
          ...result.user,
          hasRestaurant: result.hasRestaurant,
          restaurant: result.restaurant,
        });
        return;
      }

      toast.success('Welcome to Resthru!');
      router.push(redirectToRef.current || '/owner');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Keep the cross-instance callback up to date without re-initializing GIS
  useEffect(() => {
    globalGisCallback = handleCredentialResponse;
    return () => { globalGisCallback = () => {}; };
  }, [handleCredentialResponse]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    ensureGisLoaded(clientId).then(() => setReady(true));
  }, []);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Fallback button if GIS is not configured
  if (!clientId) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        className={`w-full h-11 font-medium opacity-60 cursor-not-allowed ${className}`}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {text}
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Setup needed
        </span>
      </Button>
    );
  }

  // Loading state while GIS loads
  if (!ready || isLoading) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        className={`w-full h-11 font-medium ${className}`}
      >
        <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {isLoading ? 'Signing in...' : 'Loading Google...'}
      </Button>
    );
  }

  const handleClick = useCallback(() => {
    if (!window.google?.accounts?.id) {
      console.error('[GIS] Google Identity Services not available');
      return;
    }
    try {
      window.google.accounts.id.prompt();
    } catch (e) {
      console.error('[GIS] prompt() error:', e);
    }
  }, []);

  // Render Google's rendered button inside our container
  return (
    <Button
      type="button"
      variant="outline"
      disabled={isLoading}
      className={`w-full h-11 font-medium border-border/70 hover:bg-muted/50 transition-all ${className}`}
      onClick={handleClick}
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {text}
    </Button>
  );
}
