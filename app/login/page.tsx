'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, Check, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message || 'Failed to sign in');
        return;
      }

      toast.success('Welcome back to Resthru!');
      router.push('/dashboard');
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to sign in with Google');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-primary via-primary-hover to-primary-hover flex-col items-center justify-between p-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-background rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-light rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="p-3 bg-background/10 backdrop-blur-sm rounded-lg">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Resthru</h1>
          </div>

          {/* Tagline */}
          <p className="text-xl text-white/80 font-medium mb-12">Run Smarter. Serve Better.</p>

          {/* Dashboard Mockup */}
          <div className="w-full max-w-sm mb-12">
            <div className="bg-background/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="space-y-4">
                {/* Mock chart bars */}
                <div className="flex gap-2 items-end h-32">
                  <div className="flex-1 bg-gradient-to-t from-info to-info/80 rounded-t h-3/4"></div>
                  <div className="flex-1 bg-gradient-to-t from-success to-success/80 rounded-t h-full"></div>
                  <div className="flex-1 bg-gradient-to-t from-primary to-primary-light rounded-t h-2/3"></div>
                  <div className="flex-1 bg-gradient-to-t from-accent to-accent/80 rounded-t h-4/5"></div>
                </div>

                {/* Mock metrics */}
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <div className="bg-background/10 rounded p-2">
                    <div className="text-white/60 text-xs">Orders</div>
                    <div className="text-white font-semibold">1,234</div>
                  </div>
                  <div className="bg-background/10 rounded p-2">
                    <div className="text-white/60 text-xs">Revenue</div>
                    <div className="text-white font-semibold">45.2K</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-background/20 p-2 rounded-full">
                <Check className="w-5 h-5" />
              </div>
              <span>Works Offline</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="bg-background/20 p-2 rounded-full">
                <Check className="w-5 h-5" />
              </div>
              <span>IRD Compliant</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="bg-background/20 p-2 rounded-full">
                <Check className="w-5 h-5" />
              </div>
              <span>Built for Nepal</span>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="relative z-10 text-center">
          <p className="text-white/60 text-sm">Trusted by restaurants across Nepal</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 w-full lg:w-2/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to your Resthru account</CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <FormControl>
                          <Input
                            id="email"
                            placeholder="you@example.com"
                            type="email"
                            disabled={isLoading}
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                        {!form.formState.errors.email && field.value && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <FormControl>
                          <Input
                            id="password"
                            placeholder="Enter your password"
                            type={showPassword ? 'text' : 'password'}
                            disabled={isLoading}
                            className="pl-10 pr-10"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        {!form.formState.errors.password && field.value && (
                          <Check className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              id="rememberMe"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <Label
                            htmlFor="rememberMe"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Remember me
                          </Label>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:text-primary font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-medium h-10 mt-6"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full font-medium"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <text x="5" y="18" fontSize="14" fill="currentColor">G</text>
                  </svg>
                  Sign in with Google
                </Button>
              </form>
            </Form>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-primary hover:text-primary font-semibold transition-colors"
              >
                Start free trial
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
