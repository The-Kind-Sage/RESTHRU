'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, Code, QrCode, Settings, Users, FileText, ArrowRight } from 'lucide-react';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';

const guides = [
  {
    icon: Settings,
    title: 'Quick Start Guide',
    description: 'Get your restaurant up and running with Resthru in under 10 minutes.',
    href: '/help#getting-started',
  },
  {
    icon: QrCode,
    title: 'QR Menu Setup',
    description: 'Create and configure QR code menus for contactless ordering.',
    href: '/help#staff-settings',
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Add team members, assign roles, and manage permissions.',
    href: '/help#staff-settings',
  },
  {
    icon: FileText,
    title: 'Billing & Invoicing',
    description: 'Generate IRD-compliant invoices and manage payments.',
    href: '/help#orders-billing',
  },
  {
    icon: Code,
    title: 'API Reference',
    description: 'Integrate with Resthru using our REST API.',
    href: '/api',
  },
  {
    icon: BookOpen,
    title: 'Best Practices',
    description: 'Tips and tricks to get the most out of Resthru.',
    href: '/help',
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#064e3b] py-24 sm:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Documentation</h1>
            <p className="mt-4 text-lg text-white/70">Everything you need to set up, configure, and master Resthru.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide, idx) => {
              const Icon = guide.icon;
              return (
                <motion.div
                  key={guide.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    href={guide.href}
                    className="block rounded-2xl border border-border/70 bg-white p-6 shadow-soft hover:shadow-soft-lg hover:border-primary/20 transition-all group h-full"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold group-hover:text-primary transition-colors">{guide.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Learn more <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl font-bold">
            Can&apos;t find what you&apos;re looking for?
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mt-2 text-muted-foreground">
            Check our Help Center or contact support.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-6 flex items-center justify-center gap-4">
            <Link href="/help" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors">
              Help Center
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">
              Contact Support <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
