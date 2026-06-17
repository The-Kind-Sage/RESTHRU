'use client';

import { motion } from 'framer-motion';
import { Play, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as const },
    },
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-dark">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />

      {/* Floating glowing orbs */}
      <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute -right-40 bottom-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Main headline */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight tracking-tighter text-white"
            >
              The Smartest Way to Run Your Restaurant
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed"
            >
              Resthru helps Nepal restaurants manage orders, staff, billing, and inventory — all in one place. Works even without internet.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg h-12 px-8"
              >
                Start Free Trial
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="border border-border hover:bg-primary text-white font-semibold rounded-lg h-12 px-8 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={itemVariants}
              className="space-y-3 pt-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-sm">Free forever plan</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-sm">Setup in 5 minutes</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column - Device mockup */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Phone frame mockup */}
              <div className="relative mx-auto w-full max-w-sm">
                <div className="rounded-3xl border-8 border-border bg-primary shadow-2xl overflow-hidden">
                  {/* Phone screen content */}
                  <div className="aspect-square p-6 space-y-4 bg-gradient-to-br from-primary to-primary">
                    {/* Mock status bar */}
                    <div className="h-2 bg-muted rounded-full opacity-30" />

                    {/* Mock content blocks */}
                    <div className="space-y-3 pt-2">
                      <div className="h-12 bg-gradient-to-r from-primary to-primary rounded-lg opacity-80" />
                      <div className="h-8 bg-primary rounded-lg opacity-60 w-4/5" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded opacity-40" />
                        <div className="h-4 bg-muted rounded opacity-40 w-5/6" />
                        <div className="h-4 bg-muted rounded opacity-40 w-4/5" />
                      </div>
                    </div>

                    {/* Mock chart bars */}
                    <div className="flex items-end gap-2 pt-4 h-20">
                      <div className="flex-1 bg-accent rounded-t opacity-70 h-3/5" />
                      <div className="flex-1 bg-accent rounded-t opacity-70 h-4/5" />
                      <div className="flex-1 bg-accent rounded-t opacity-70 h-2/5" />
                      <div className="flex-1 bg-accent rounded-t opacity-70 h-3/4" />
                    </div>
                  </div>
                </div>

                {/* Glow effect behind mockup */}
                <div className="absolute -inset-8 bg-primary/20 blur-2xl rounded-3xl -z-10" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
