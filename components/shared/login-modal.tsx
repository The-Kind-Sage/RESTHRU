'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/lib/supabase';
import { createSessionFromSupabaseLogin } from '@/lib/actions/auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      if (!supabase) {
        toast.error('Supabase is not configured. Please set environment variables.');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        toast.error(error.message || 'Failed to sign in');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const result = session?.user
        ? await createSessionFromSupabaseLogin(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.full_name as string | undefined
          )
        : null;

      if (!result?.success) {
        const errMsg = result?.error || 'Could not set up your session';
        console.warn('Session setup warning:', errMsg);
      }

      toast.success('Welcome back to Resthru!');
      onOpenChange(false);
      router.push(result?.redirectTo || '/dashboard');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden border-0 shadow-soft-lg">
        {/* Brand header */}
        <div className="bg-gradient-to-br from-primary via-primary-hover to-[#064e3b] px-8 pt-8 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />
          </div>
          <div className="relative z-10 flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Resthru</span>
          </div>
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
              Welcome back
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-1">
              Sign in to manage your restaurant
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="modal-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Email address
                    </Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="modal-email"
                          placeholder="you@example.com"
                          type="email"
                          disabled={isLoading}
                          className="pl-10 h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="modal-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Password
                      </Label>
                      <Link
                        href="/dashboard/forgot-password"
                        className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                        onClick={() => onOpenChange(false)}
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          id="modal-password"
                          placeholder="Enter your password"
                          type={showPassword ? 'text' : 'password'}
                          disabled={isLoading}
                          className="pl-10 pr-10 h-11 border-border/70 bg-muted/30 focus:bg-white transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-primary hover:bg-primary-hover text-white font-semibold shadow-md shadow-primary/20 transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/70" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground/70 font-medium tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* Google button */}
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className="w-full h-11 font-medium border-border/70 hover:bg-muted/50 transition-all"
            onClick={() => toast.info('Google sign-in coming soon')}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="text-primary hover:text-primary-hover font-semibold transition-colors"
              onClick={() => {
                onOpenChange(false);
                document.dispatchEvent(new CustomEvent('open-register'));
              }}
            >
              Start free trial
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
