'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,_#041a12_0%,_#0a4d36_35%,_#0e7a52_65%,_#12a068_100%)]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />
      <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-white/[0.04] blur-[120px]" />
      <div className="absolute -right-20 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/[0.06] blur-[100px]" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Get started in under 5 minutes
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Ready to transform{' '}
            <span className="bg-gradient-to-r from-accent to-amber-300 bg-clip-text text-transparent">
              your restaurant?
            </span>
          </h2>
          <p className="text-base sm:text-lg text-white/55 max-w-xl mx-auto mb-8">
            Join 500+ restaurants in Nepal already using Resthru. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/register">
              <Button
                size="lg"
                className="group h-12 rounded-xl bg-white px-8 text-[15px] font-semibold text-primary shadow-[0_8px_30px_-6px_rgba(0,0,0,0.3)] transition-all hover:bg-white/95"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="ghost"
                size="lg"
                className="h-12 rounded-xl border border-white/15 bg-white/[0.06] px-8 text-[15px] font-medium text-white/90 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.12]"
              >
                Talk to Sales
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['Free forever', 'No credit card', '5 min setup', 'Nepal support'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-white/45">
                <Check className="h-4 w-4 flex-shrink-0 text-accent/70" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
