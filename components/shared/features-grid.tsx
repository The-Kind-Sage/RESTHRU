'use client';

import { motion } from 'framer-motion';
import {
  QrCode,
  WifiOff,
  ChefHat,
  Receipt,
  Package,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Feature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  colorClass: string;
  bgColorClass: string;
}

const features: Feature[] = [
  {
    id: '1',
    icon: QrCode,
    title: 'Smart QR Ordering',
    description:
      'Customers scan, browse, and order directly from their phone. No app download needed.',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgColorClass: 'bg-indigo-100 dark:bg-indigo-950',
  },
  {
    id: '2',
    icon: WifiOff,
    title: 'Works Without Internet',
    description:
      'Never stop serving. Resthru keeps working even when your internet goes down.',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgColorClass: 'bg-emerald-100 dark:bg-emerald-950',
  },
  {
    id: '3',
    icon: ChefHat,
    title: 'Live Kitchen Display',
    description:
      'Orders fly from table to kitchen instantly. No more shouting across the restaurant.',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgColorClass: 'bg-amber-100 dark:bg-amber-950',
  },
  {
    id: '4',
    icon: Receipt,
    title: 'One-tap Billing',
    description:
      'Generate IRD-compliant bills, split payments, and print receipts in seconds.',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgColorClass: 'bg-indigo-100 dark:bg-indigo-950',
  },
  {
    id: '5',
    icon: Package,
    title: 'Inventory Alerts',
    description:
      'Never run out of stock. Get alerts when ingredients are running low.',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgColorClass: 'bg-emerald-100 dark:bg-emerald-950',
  },
  {
    id: '6',
    icon: BarChart3,
    title: 'Live Reports',
    description:
      'See your best dishes, peak hours, and daily revenue at a glance.',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgColorClass: 'bg-amber-100 dark:bg-amber-950',
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

export function FeaturesGrid() {
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
            Everything your restaurant needs
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            One platform. Zero chaos.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg dark:hover:shadow-xl transition-shadow duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <CardHeader className="pb-4">
                    <div className={`w-14 h-14 rounded-xl ${feature.bgColorClass} flex items-center justify-center mb-4`}>
                      <Icon className={`w-7 h-7 ${feature.colorClass}`} />
                    </div>
                    <CardTitle className="text-xl text-slate-900 dark:text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
