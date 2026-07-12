'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  { id: 'free', name: 'Starter', price: 'Free', description: 'For the single-room place still finding its feet.', features: ['Up to 2 tables', 'Basic QR ordering', 'Manual billing', 'Email support'] },
  { id: 'basic', name: 'Growth', price: 'Rs. 999', period: '/month', description: 'For when one QR code is no longer enough.', features: ['Up to 10 tables', 'Full QR ordering', 'Automated billing', 'Inventory tracking', 'Priority support'], isPopular: true },
  { id: 'pro', name: 'Enterprise', price: 'Rs. 2,999', period: '/month', description: 'For chains juggling more than one kitchen.', features: ['Unlimited tables', 'All Growth features', 'Advanced analytics', 'Multi-location', 'API access', 'Dedicated support'] },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function PricingPreview() {
  return (
    <section id="pricing" className="relative py-10 sm:py-16 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }} className="mb-6 sm:mb-12 text-center">
          <p className="mb-2 text-xs sm:text-xs font-semibold uppercase tracking-[0.3em] text-primary">Pricing</p>
          <h2 className="mb-2 sm:mb-4 text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight text-foreground">Best pricing, no hidden charges.</h2>
          <p className="mx-auto max-w-md text-sm sm:text-base text-muted-foreground">Start free. Move up only when your restaurant outgrows it, never before.</p>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
          {plans.map((plan) => (
            <motion.div key={plan.id} variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="relative">
              {plan.isPopular && <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />}
              <div className={`relative flex h-full flex-col rounded-xl border p-4 sm:p-5 transition-all duration-300 ${plan.isPopular ? 'border-primary/25 bg-gradient-to-b from-white via-primary-light/10 to-white shadow-[0_6px_30px_-10px_rgba(14,122,82,0.15)]' : 'border-border/50 bg-card hover:border-border hover:shadow-sm'}`}>
                <div className="mb-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg sm:text-base font-semibold text-foreground">{plan.name}</h3>
                    {plan.isPopular && <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">Popular</span>}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-3xl font-bold tracking-tight text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-4 flex-1 space-y-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className={`group flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all ${plan.isPopular ? 'bg-primary text-white hover:bg-primary-hover shadow-sm' : 'border border-border bg-background text-foreground hover:border-primary/30 hover:bg-primary/5'}`}>
                  Get started
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="mt-6 sm:mt-10 text-center">
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover">
            Compare all plans <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
