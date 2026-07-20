'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UtensilsCrossed, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/actions/auth';

// Mobile-first login for the waiter order station. Credentials are issued by
// the owner in Staff Management → Waiter Logins (createWaiterLogin), which
// creates a User with role WAITER scoped to the restaurant. On success the
// waiter lands on /order.
function WaiterLoginForm() {
  const searchParams = useSearchParams();
  // The proxy forwards the original target as ?redirect=; default to the
  // station itself so a waiter always ends up on /order.
  const redirectTo = searchParams.get('redirect') || '/order';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // blockAdmin: an admin's credentials must never open the waiter station —
    // admins sign in only through the admin console.
    const result = await login(username.trim(), password, redirectTo, { blockAdmin: true });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      // Full navigation (not router.push) so no in-memory state from a previous
      // session survives into this one on a shared station device.
      window.location.assign(result.redirectTo);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-primary to-primary-hover px-5 pb-8 pt-safe-top">
      {/* Brand / hero */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm">
          <UtensilsCrossed className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Waiter Sign In</h1>
        <p className="mt-1.5 text-sm text-white/80">
          Sign in to take orders. Ask your manager for your login.
        </p>
      </div>

      {/* Login card — pinned toward the bottom for one-handed thumb reach */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md self-center space-y-4 rounded-3xl bg-card p-6 shadow-2xl"
      >
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium">
            Username
          </Label>
          <Input
            id="username"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            placeholder="you@example.com or +977..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
            className="h-12 rounded-xl text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="h-12 rounded-xl pr-12 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !username.trim() || !password}
          className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 pt-2 text-sm text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </form>
    </div>
  );
}

export default function WaiterLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-primary to-primary-hover">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      }
    >
      <WaiterLoginForm />
    </Suspense>
  );
}
