'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  { id: '1', quote: 'Resthru transformed our restaurant overnight. Orders are faster, billing is seamless.', author: 'Ramesh Sharma', role: 'Owner', restaurant: 'Himalayan Kitchen', initials: 'RS', rating: 5, highlight: '3x faster service' },
  { id: '2', quote: 'Managing inventory used to take hours. Now it\'s automatic. Reports help me decide better.', author: 'Sita Thapa', role: 'Manager', restaurant: 'Thakali House', initials: 'ST', rating: 5, highlight: '80% less admin' },
  { id: '3', quote: 'QR ordering cut wait times by 40%. Customers love it and we serve more tables.', author: 'Binod Karki', role: 'Owner', restaurant: 'Newari Delights', initials: 'BK', rating: 5, highlight: '40% less wait' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-primary/[0.02] to-background py-10 sm:py-16 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }} className="mb-6 sm:mb-12 text-center">
          <p className="mb-2 text-xs sm:text-xs font-semibold uppercase tracking-[0.3em] text-primary">Testimonials</p>
          <h2 className="mb-2 sm:mb-4 text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight text-foreground">Restaurants love Resthru</h2>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
          {testimonials.map((t) => (
            <motion.div key={t.id} variants={itemVariants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
              <div className="group flex h-full flex-col rounded-xl border border-border/50 bg-card p-4 sm:p-5 transition-all duration-300 hover:border-primary/15 hover:shadow-[0_6px_30px_-10px_rgba(14,122,82,0.1)]">
                <div className="mb-3 flex gap-0.5">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <blockquote className="mb-3 flex-1 text-base sm:text-sm leading-relaxed text-foreground/80">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                {t.highlight && (
                  <span className="mb-3 inline-flex self-start items-center rounded-full bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">{t.highlight}</span>
                )}
                <div className="flex items-center gap-2.5 border-t border-border/40 pt-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600">
                    <span className="text-xs font-bold text-white">{t.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.author}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.role}, {t.restaurant}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
