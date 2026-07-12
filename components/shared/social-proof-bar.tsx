'use client';

import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star, TrendingUp, Users, Clock } from 'lucide-react';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start center'] });
  const raw = useTransform(scrollYProgress, [0, 1], [0, value]);
  const count = useSpring(raw, { stiffness: 60, damping: 30 });
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  return (
    <span ref={ref}>
      {isInView ? (
        <motion.span>{rounded}</motion.span>
      ) : (
        <span>0</span>
      )}
      {suffix}
    </span>
  );
}

const stats = [
  { icon: Users, value: 500, suffix: '+', label: 'Restaurants' },
  { icon: TrendingUp, value: 2000000, suffix: '+', label: 'Orders' },
  { icon: Clock, value: 99.9, suffix: '%', label: 'Uptime' },
];

const restaurants = [
  'Himalayan Kitchen',
  'Thakali House',
  'Newari Delights',
  'Kathmandu Cafe',
  'Pokhara Grill',
];

export function SocialProofBar() {
  return (
    <section className="relative border-y border-border/40 bg-background/80 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-4 sm:mb-8 grid grid-cols-3 gap-2"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col items-center gap-1.5 text-center">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/8">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-foreground">
                  {stat.value >= 1000 ? (
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  ) : (
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  )}
                </p>
                <p className="text-xs sm:text-xs text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>

        <div className="mb-4 sm:mb-6 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-center"
        >
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 sm:gap-x-8 sm:gap-y-3 mb-4 sm:mb-6">
            {restaurants.map((name) => (
              <span
                key={name}
                className="text-xs sm:text-sm font-medium text-foreground/35 transition-colors hover:text-foreground/60"
              >
                {name}
              </span>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
              ))}
            </div>
            <div className="h-3 w-px bg-border" />
            <p className="text-xs sm:text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">4.9/5</span> from 200+ reviews
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
