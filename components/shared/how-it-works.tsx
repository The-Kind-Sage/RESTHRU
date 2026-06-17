'use client';

import { motion } from 'framer-motion';
import { UserPlus, Settings, QrCode } from 'lucide-react';

interface Step {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  time: string;
}

const steps: Step[] = [
  {
    id: 1,
    icon: UserPlus,
    title: 'Register your restaurant',
    time: '30 seconds',
  },
  {
    id: 2,
    icon: Settings,
    title: 'Set up your menu and tables',
    time: '5 minutes',
  },
  {
    id: 3,
    icon: QrCode,
    title: 'Print QR codes and start taking orders',
    time: 'Ready!',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

export function HowItWorks() {
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
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            Up and running in 3 steps
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between relative"
        >
          {/* Connecting line - hidden on mobile */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500 -z-10" />

          {/* Steps */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-0 w-full">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  variants={itemVariants}
                  className="flex-1 flex flex-col items-center text-center relative"
                >
                  {/* Step circle */}
                  <div className="relative z-10 mb-6">
                    <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-200 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-emerald-100 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-indigo-600" />
                      </div>
                    </div>
                    {/* Step number */}
                    <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                      {step.id}
                    </div>
                  </div>

                  {/* Step content */}
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    {step.time}
                  </p>

                  {/* Connector dots - show only on mobile between items */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden mt-8 w-1 h-8 bg-gradient-to-b from-indigo-500 via-emerald-500 to-amber-500 rounded-full" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
