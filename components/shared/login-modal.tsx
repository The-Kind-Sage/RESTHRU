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
import { login } from '@/lib/actions/auth';
import { GoogleSignInButton } from '@/components/shared/google-sign-in';

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
      const result = await login(data.email, data.password, undefined, { blockAdmin: true });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Welcome back to Resthru!');
      onOpenChange(false);
      router.push(result.redirectTo || '/owner');
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
                        href="/owner/forgot-password"
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
          <GoogleSignInButton />

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
