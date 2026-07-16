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
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              id_token?: string;
              error?: string;
            }) => void;
            error_callback?: (error: any) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
  return scriptLoadPromise;
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
  const [ready, setReady] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  const redirectToRef = useRef(redirectTo);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleClick = useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      toast.error('Google Identity Services not available');
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error('Google sign-in is not configured');
      return;
    }

    try {
      setIsLoading(true);

      popupTimerRef.current = setTimeout(() => {
        setIsLoading(false);
        toast.error('Popup blocked. Please allow popups for this site to sign in with Google.');
      }, 3000);

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (response) => {
          if (popupTimerRef.current) {
            clearTimeout(popupTimerRef.current);
            popupTimerRef.current = null;
          }
          setIsLoading(false);
          if (response.error) {
            if (response.error === 'popup_closed_by_user') return;
            console.error('[OAuth] error:', response.error);
            toast.error('Google sign-in failed');
            return;
          }
          if (response.id_token) {
            handleCredentialResponse({ credential: response.id_token });
          } else {
            toast.error('No ID token received from Google');
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
        popupTimerRef.current = null;
      }
      setIsLoading(false);
      console.error('[OAuth] error:', e);
      toast.error('Failed to start Google sign-in');
    }
  }, [handleCredentialResponse]);

  useEffect(() => {
    loadGsiScript().then(() => setReady(true));
  }, []);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
