'use client';

import { motion } from 'framer-motion';
import { UserPlus, Settings, QrCode } from 'lucide-react';

const steps = [
  { id: 1, icon: UserPlus, title: 'Make an account', description: 'Your email and your restaurant’s name. That’s the whole form.', time: '30 sec' },
  { id: 2, icon: Settings, title: 'Add your menu', description: 'Punch in your dishes, prices, and tables, from momo to thali set.', time: '5 min' },
  { id: 3, icon: QrCode, title: 'Stick on the QR codes', description: 'Print them, tape them to the tables, and you’re taking orders.', time: 'Go live' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-primary/[0.02] to-background py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }} className="mb-8 sm:mb-12 text-center">
          <p className="mb-2 text-xs sm:text-xs font-semibold uppercase tracking-[0.3em] text-primary">Getting started</p>
          <h2 className="mb-2 sm:mb-4 text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight text-foreground">Three steps, one afternoon</h2>
          <p className="mx-auto max-w-md text-sm sm:text-base text-muted-foreground">No installer, no training day, no consultant in a tie. Just you and a printer.</p>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="relative">
            <div className="absolute left-[29px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/15 via-primary/30 to-primary/15 sm:hidden" />
            <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-primary/15 via-primary/30 to-primary/15 lg:block" />

            <div className="space-y-5 sm:space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <motion.div key={step.id} variants={itemVariants} className="relative flex items-start gap-4 sm:items-center sm:gap-5 sm:text-center lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center rounded-full border-2 border-primary/15 bg-background shadow-[0_0_0_6px_rgba(14,122,82,0.04)] lg:mb-5">
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 z-20 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg">
                        {step.id}
                      </div>
                    </div>

                    <div className="flex-1 sm:flex-none">
                      <h3 className="mb-0.5 text-base sm:text-base lg:text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="mb-1.5 max-w-[240px] text-sm sm:text-sm text-muted-foreground lg:max-w-none">{step.description}</p>
                      <span className="inline-flex items-center rounded-full bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">{step.time}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
