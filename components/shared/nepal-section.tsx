'use client';

import { motion } from 'framer-motion';
import { Wallet, FileCheck, Calendar, Wifi, Languages, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const features = [
  { id: '1', icon: Wallet, title: 'eSewa & Khalti', description: 'Accept payments through Nepal\'s popular digital wallets.' },
  { id: '2', icon: FileCheck, title: 'IRD Compliant', description: 'Legally compliant bills with automatic IRD integration.' },
  { id: '3', icon: Calendar, title: 'Bikram Sambat', description: 'Automatic dates in Nepal\'s BS calendar.' },
  { id: '4', icon: Wifi, title: 'Low Bandwidth', description: 'Runs fine on a slow 3G phone in a basement kitchen.' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function NepalSection() {
  return (
    <section id="about" className="relative py-10 sm:py-16 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}>
            <p className="mb-2 text-xs sm:text-xs font-semibold uppercase tracking-[0.3em] text-primary">Made for Nepal</p>
            <h2 className="mb-2 sm:mb-4 text-2xl sm:text-3xl lg:text-[2.5rem] font-bold tracking-tight text-foreground leading-tight">
              Built for Nepal. <span className="text-primary">By Nepal.</span>
            </h2>
            <p className="mb-5 sm:mb-8 max-w-md text-sm sm:text-base text-muted-foreground">The details foreign POS systems never bother to get right.</p>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-1">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.id} variants={itemVariants} className="group flex items-start gap-3 rounded-lg border border-transparent p-2.5 transition-all hover:border-border/50 hover:bg-card">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/8 transition-colors group-hover:bg-primary/12">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover">
                Start Free Trial <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <div className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/15 bg-primary/5 px-3.5 py-2">
                <Languages className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Nepali & English</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} viewport={{ once: true }} className="hidden lg:block">
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today&apos;s Revenue</p>
                    <p className="text-xl font-bold text-foreground">Rs. 1,24,500</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">↑ 18%</span>
                </div>
                <div className="mb-3 h-px bg-border/50" />
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {[{ v: '24', l: 'Orders' }, { v: '18', l: 'Tables' }, { v: '3', l: 'Staff' }].map((s) => (
                    <div key={s.l} className="rounded-lg bg-muted/50 p-2.5 text-center">
                      <p className="text-base font-bold text-foreground">{s.v}</p>
                      <p className="text-xs text-muted-foreground">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5">
                  <p className="mb-2.5 text-xs font-medium text-muted-foreground">Recent Payments</p>
                  <div className="space-y-2">
                    {[{ m: 'eSewa', a: 'Rs. 2,450' }, { m: 'Khalti', a: 'Rs. 1,800' }, { m: 'Cash', a: 'Rs. 3,200' }].map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10">
                            <Wallet className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{p.m}</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{p.a}</span>
                      </div>
                    ))}
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
