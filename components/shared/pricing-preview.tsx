'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  features: string[];
  isPopular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    features: [
      'Up to 2 tables',
      'Basic QR ordering',
      'Manual billing',
      'Email support',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$99',
    features: [
      'Up to 10 tables',
      'Full QR ordering',
      'Automated billing',
      'Inventory tracking',
      'Priority support',
    ],
    isPopular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$299',
    features: [
      'Unlimited tables',
      'All Basic features',
      'Advanced analytics',
      'Multi-location',
      'API access',
      'Dedicated support',
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export function PricingPreview() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            No hidden fees. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 sm:gap-8 md:grid-cols-3 lg:gap-8"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Glow effect for popular plan */}
              {plan.isPopular && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-lg blur opacity-20 -z-10" />
              )}

              <Card
                className={`h-full border-2 transition-all duration-300 ${
                  plan.isPopular
                    ? 'border-indigo-600 dark:border-indigo-500 bg-gradient-to-b from-white to-indigo-50 dark:from-slate-900 dark:to-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-2xl text-slate-900 dark:text-white">
                      {plan.name}
                    </CardTitle>
                    {plan.isPopular && (
                      <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                        Most Popular
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">
                      {plan.price}
                    </p>
                    {plan.id !== 'free' && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        per month, billed annually
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features list */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* See all plans link */}
                  <Link
                    href="/pricing"
                    className="block text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors py-2 border-t border-slate-200 dark:border-slate-800 pt-4"
                  >
                    See all plans
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
