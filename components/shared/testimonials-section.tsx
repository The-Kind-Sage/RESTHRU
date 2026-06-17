'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  restaurant: string;
  location: string;
  initials: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    quote:
      'Resthru changed how we run our restaurant. Orders are faster, billing is seamless.',
    author: 'Ramesh Sharma',
    restaurant: 'Himalayan Kitchen',
    location: 'Kathmandu',
    initials: 'RS',
    rating: 5,
  },
  {
    id: '2',
    quote:
      'The offline mode is a lifesaver. Our internet goes down often but we never stop.',
    author: 'Sita Thapa',
    restaurant: 'Thakali House',
    location: 'Pokhara',
    initials: 'ST',
    rating: 5,
  },
  {
    id: '3',
    quote:
      'QR ordering reduced our wait times by 40%. Customers love it!',
    author: 'Binod Karki',
    restaurant: 'Newari Delights',
    location: 'Chitwan',
    initials: 'BK',
    rating: 5,
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

export function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
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
            Restaurants love Resthru
          </h2>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full border-slate-200 bg-white hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  {/* Quote text */}
                  <blockquote className="text-base sm:text-lg font-medium text-slate-900 italic mb-6">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Star rating */}
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Avatar and info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-white">
                        {testimonial.initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {testimonial.author}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 truncate">
                        {testimonial.restaurant}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
