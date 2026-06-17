'use client';

import { motion } from 'framer-motion';
import { Wallet, FileCheck, Calendar, Wifi, Languages } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NepalFeature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  colorClass: string;
  bgColorClass: string;
}

const features: NepalFeature[] = [
  {
    id: '1',
    icon: Wallet,
    title: 'eSewa & Khalti Payments',
    description: 'Accept payments through Nepal\'s most popular digital wallets',
    colorClass: 'text-indigo-600',
    bgColorClass: 'bg-indigo-100',
  },
  {
    id: '2',
    icon: FileCheck,
    title: 'IRD Compliant Billing',
    description: 'Generate legally compliant bills with automatic IRD integration',
    colorClass: 'text-emerald-600',
    bgColorClass: 'bg-emerald-100',
  },
  {
    id: '3',
    icon: Calendar,
    title: 'Bikram Sambat Dates',
    description: 'Automatically calculate dates in Nepal\'s Bikram Sambat calendar',
    colorClass: 'text-amber-600',
    bgColorClass: 'bg-amber-100',
  },
  {
    id: '4',
    icon: Wifi,
    title: 'Works on Nepal\'s Internet',
    description: 'Optimized for lower bandwidth and unreliable connections',
    colorClass: 'text-indigo-600',
    bgColorClass: 'bg-indigo-100',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

export function NepalSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Built for Nepal. By Nepal.
          </h2>
          <p className="text-lg text-slate-600">
            Every feature designed with Nepal's unique needs in mind
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-2"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full border-slate-200 bg-white hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`w-12 h-12 rounded-lg ${feature.bgColorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${feature.colorClass}`} />
                      </div>
                      <CardTitle className="text-xl text-slate-900">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Languages callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-200">
            <Languages className="w-5 h-5 text-indigo-600" />
            <span className="text-sm sm:text-base font-medium text-indigo-900">
              Available in Nepali and English
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
