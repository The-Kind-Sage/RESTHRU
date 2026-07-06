'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';

const posts = [
  {
    title: 'Why Digital menus are the future for Nepali restaurants',
    excerpt: 'QR code menus are transforming the dining experience across Nepal. Here\'s how they help restaurants save costs and delight customers.',
    date: '2025-06-15',
    readTime: '5 min read',
    category: 'Industry',
    slug: 'digital-menus-nepal',
  },
  {
    title: 'IRD Compliance Made Simple with Resthru',
    excerpt: 'Navigating Nepal\'s tax requirements doesn\'t have to be complicated. Learn how Resthru automates IRD-compliant billing for you.',
    date: '2025-05-20',
    readTime: '4 min read',
    category: 'Product',
    slug: 'ird-compliance-resthru',
  },
  {
    title: '5 Tips to Reduce Food Waste in Your Restaurant',
    excerpt: 'Food waste is a major cost for restaurants. These practical tips will help you minimize waste and improve your bottom line.',
    date: '2025-04-10',
    readTime: '6 min read',
    category: 'Tips',
    slug: 'reduce-food-waste',
  },
  {
    title: 'How to Set Up Your Restaurant on Resthru in 10 Minutes',
    excerpt: 'Getting started with Resthru is quick and easy. Follow this step-by-step guide to set up your restaurant profile today.',
    date: '2025-03-05',
    readTime: '3 min read',
    category: 'Tutorial',
    slug: 'setup-resthru-10-minutes',
  },
  {
    title: 'Managing Staff Schedules: A Guide for Restaurant Owners',
    excerpt: 'Effective staff scheduling improves employee satisfaction and reduces operational costs. Here\'s our comprehensive guide.',
    date: '2025-02-15',
    readTime: '7 min read',
    category: 'Tips',
    slug: 'staff-scheduling-guide',
  },
  {
    title: 'The Rise of Contactless Ordering in Nepal',
    excerpt: 'How QR-based contactless ordering is becoming the new normal in Nepali restaurants and what it means for your business.',
    date: '2025-01-20',
    readTime: '5 min read',
    category: 'Industry',
    slug: 'contactless-ordering-nepal',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#064e3b] py-24 sm:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Blog
            </h1>
            <p className="mt-6 text-lg text-white/70">
              Insights, tips, and news from the Resthru team. Stay updated on restaurant technology and best practices.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, idx) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group rounded-2xl border border-border/70 bg-white shadow-soft overflow-hidden hover:shadow-soft-lg transition-all"
              >
                <div className="h-2 bg-gradient-to-r from-primary to-primary-hover" />
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{post.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                  >
                    Read more <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-bold"
          >
            Stay in the loop
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-muted-foreground"
          >
            Get the latest articles and product updates delivered to your inbox.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex max-w-md mx-auto gap-3"
          >
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 h-11 rounded-full border border-border/70 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
              Subscribe
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
