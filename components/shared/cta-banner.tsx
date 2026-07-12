'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      {/* Luxury black image background — deliberately different from the
          bright-green footer directly below so the two sections read as
          separate bands. */}
      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/cta-bg.svg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Free to start, no card, no catch
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Come run your restaurant{' '}
            <span className="text-accent">with us.</span>
          </h2>
          <p className="text-base sm:text-lg text-white max-w-xl mx-auto mb-8">
            500+ Nepali restaurants already do, from Thamel tea shops to Pokhara rooftops. The first plan is free, and nobody asks for a card.
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
            {['Free to start', 'No credit card', 'Live in an afternoon', 'Support in Nepali'].map((item) => (
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
