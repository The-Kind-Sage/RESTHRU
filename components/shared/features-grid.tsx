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

interface Feature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  stat?: string;
}

const features: Feature[] = [
  { id: '1', icon: QrCode, title: 'Smart QR Ordering', description: 'Customers scan, browse, and order from their phone. No app needed.', stat: '3x faster' },
  { id: '2', icon: WifiOff, title: 'Works Offline', description: 'Never stop serving. Resthru keeps working when internet drops.', stat: '99.9% uptime' },
  { id: '3', icon: ChefHat, title: 'Live Kitchen Display', description: 'Orders fly from table to kitchen instantly. Zero shouting.', stat: '40% less wait' },
  { id: '4', icon: Receipt, title: 'One-tap Billing', description: 'IRD-compliant bills, split payments, receipts in seconds.', stat: 'IRD compliant' },
  { id: '5', icon: Package, title: 'Inventory Alerts', description: 'Never run out of stock. Auto alerts when ingredients run low.', stat: 'Auto tracking' },
  { id: '6', icon: BarChart3, title: 'Live Reports', description: 'Best dishes, peak hours, daily revenue — all at a glance.', stat: 'Real-time' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-10 sm:py-16 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }} className="mb-6 sm:mb-12 text-center">
          <p className="mb-2 text-xs sm:text-xs font-semibold uppercase tracking-[0.3em] text-primary">Features</p>
          <h2 className="mb-2 sm:mb-4 text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight text-foreground">Everything your restaurant needs</h2>
          <p className="mx-auto max-w-md text-sm sm:text-base text-muted-foreground">One system for orders, billing, inventory, and growth.</p>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.id} variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                <div className="group h-full rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:border-primary/15 hover:shadow-[0_6px_30px_-10px_rgba(14,122,82,0.12)]">
                  <div className="mb-3 sm:mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 transition-transform group-hover:scale-110 group-hover:bg-primary/12">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-1 text-base sm:text-sm font-semibold text-foreground">{feature.title}</h3>
                  <p className="mb-2.5 text-sm sm:text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  {feature.stat && (
                    <span className="inline-flex items-center rounded-full bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">{feature.stat}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
