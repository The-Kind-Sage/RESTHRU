'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Check, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  return (
    <section className="relative min-h-[auto] sm:min-h-[85vh] lg:min-h-[90vh] overflow-hidden bg-[linear-gradient(145deg,_#041a12_0%,_#0a4d36_35%,_#0e7a52_65%,_#12a068_100%)]">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
      <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-white/[0.04] blur-[120px]" />
      <div className="absolute -right-20 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/[0.06] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-6 pt-8 pb-6 sm:pt-20 sm:pb-16 lg:grid-cols-[1fr_0.85fr] lg:pt-32 lg:pb-28 lg:gap-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3 sm:space-y-6"
          >
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-xs sm:text-xs font-medium text-white/80 backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Now serving 500+ restaurants
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[4.25rem] font-bold leading-[1.1] tracking-tight text-white max-w-[600px]"
            >
              The smarter way to run{' '}
              <span className="bg-gradient-to-r from-accent to-amber-300 bg-clip-text text-transparent">
                your restaurant
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-base lg:text-lg text-white/55 max-w-[480px] leading-relaxed"
            >
              Manage orders, staff, billing, and inventory from one powerful dashboard. Built for Nepal.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col gap-2 pt-0.5 sm:gap-2.5 sm:pt-1">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="group w-full h-11 sm:h-12 rounded-xl bg-white px-5 text-[15px] sm:text-[15px] font-semibold text-primary shadow-[0_8px_30px_-6px_rgba(0,0,0,0.3)] transition-all hover:bg-white/95"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto h-11 sm:h-12 rounded-xl border border-white/15 bg-white/[0.06] px-5 text-[15px] sm:text-[15px] font-medium text-white/90 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.12]"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-3 sm:gap-5 pt-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm sm:text-sm text-white/45">
                <span className="font-semibold text-white/75">4.9/5</span> from 200+ owners
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-5"
            >
              {['Free forever', 'No credit card', '5 min setup'].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-xs sm:text-xs text-white/45">
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-accent/70" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="hidden lg:block"
          >
            <div className="relative mx-auto w-full max-w-[400px]">
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-white/[0.06] via-accent/[0.04] to-transparent blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.06] p-2.5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
                <div className="rounded-[1.25rem] border border-white/[0.1] bg-gradient-to-br from-[#0c6b47] via-[#119260] to-[#18b874] p-5 text-white">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-white/50">Dashboard</p>
                      <p className="text-sm font-semibold">Today&apos;s Overview</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
                      Live
                    </span>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-white/10 bg-white/[0.08] p-3">
                      <p className="text-xs font-medium uppercase tracking-widest text-white/50">Revenue</p>
                      <p className="mt-1 text-xl font-bold">Rs. 45.2K</p>
                      <p className="mt-0.5 text-xs font-medium text-green-300">↑ 12%</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.08] p-3">
                      <p className="text-xs font-medium uppercase tracking-widest text-white/50">Orders</p>
                      <p className="mt-1 text-xl font-bold">1,234</p>
                      <p className="mt-0.5 text-xs font-medium text-green-300">↑ 8%</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.08] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-widest text-white/50">Weekly Orders</p>
                      <p className="text-xs font-medium text-white/50">This week</p>
                    </div>
                    <div className="flex h-16 items-end gap-1">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-white/30" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-white/40">
                      {['M','T','W','T','F','S','S'].map((d, i) => <span key={i}>{d}</span>)}
                    </div>
                  </div>

                  <div className="mt-2.5 rounded-xl border border-white/10 bg-white/[0.08] p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-white/50">Active Tables</p>
                        <p className="text-base font-bold">18 / 24</p>
                      </div>
                      <div className="h-10 w-10 rounded-full border-2 border-white/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-white/80">75%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
