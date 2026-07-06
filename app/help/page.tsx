'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, BookOpen, MessageCircle, ArrowRight, ChevronDown } from 'lucide-react';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import { useState } from 'react';

const categories = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    articles: [
      { title: 'How to create your restaurant account', description: 'Step-by-step guide to signing up and setting up your restaurant profile.' },
      { title: 'Setting up your menu', description: 'How to add categories, items, prices, and photos to your digital menu.' },
      { title: 'Configuring table layout', description: 'Design your restaurant floor plan and set up table QR codes.' },
    ],
  },
  {
    title: 'Orders & Billing',
    icon: MessageCircle,
    articles: [
      { title: 'How to accept and manage orders', description: 'Learn the order workflow from receiving to completion.' },
      { title: 'Generating IRD-compliant bills', description: 'Create tax invoices that meet Nepal IRD requirements.' },
      { title: 'Splitting and merging bills', description: 'How to split checks between guests or merge multiple orders.' },
    ],
  },
  {
    title: 'Staff & Settings',
    icon: Search,
    articles: [
      { title: 'Adding and managing staff members', description: 'Invite staff, assign roles, and manage permissions.' },
      { title: 'Restaurant settings overview', description: 'Configure operating hours, taxes, payment methods, and more.' },
      { title: 'Generating QR codes for tables', description: 'Create and print QR codes for contactless ordering.' },
    ],
  },
];

const faqs = [
  {
    q: 'Is Resthru free to use?',
    a: 'Resthru offers a free Starter plan with basic features. Paid plans (Growth, Pro, Enterprise) unlock advanced features like analytics, multi-branch support, and priority support.',
  },
  {
    q: 'Does Resthru work offline?',
    a: 'Resthru is a cloud-based platform and requires an internet connection. However, we are working on offline capabilities for future releases.',
  },
  {
    q: 'Is Resthru IRD-compliant?',
    a: 'Yes. Resthru generates IRD-compliant invoices and tax bills that meet Nepal\'s Inland Revenue Department requirements.',
  },
  {
    q: 'Can I use Resthru on my phone?',
    a: 'Absolutely. Resthru works on any device with a web browser — phones, tablets, and computers. No app download required.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach us at support@resthru.com or through the in-app chat. Pro and Enterprise customers get priority support with faster response times.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/70 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left font-semibold hover:bg-muted/30 transition-colors"
      >
        {q}
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#064e3b] py-24 sm:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Help Center</h1>
            <p className="mt-4 text-lg text-white/70">Find answers, guides, and support for everything Resthru.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full h-12 pl-12 pr-4 rounded-full border-0 bg-white/95 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30 placeholder:text-muted-foreground"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl border border-border/70 bg-white p-6 shadow-soft"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold mb-4">{cat.title}</h2>
                  <div className="space-y-3">
                    {cat.articles.map((article) => (
                      <div key={article.title} className="group cursor-pointer">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{article.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl font-bold text-center mb-10">
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} {...faq} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl font-bold">
            Still need help?
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mt-2 text-muted-foreground">
            Our team is ready to assist you.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              Contact Support <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
