'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';

const openings = [
  {
    title: 'Full-Stack Developer',
    department: 'Engineering',
    location: 'Remote / Kathmandu',
    type: 'Full-time',
    description: 'Build and maintain the Resthru platform. Work with Next.js, Supabase, and modern web technologies.',
  },
  {
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Remote / Kathmandu',
    type: 'Full-time',
    description: 'Design intuitive interfaces that restaurant owners love. Shape the product experience from concept to delivery.',
  },
  {
    title: 'Restaurant Onboarding Specialist',
    department: 'Customer Success',
    location: 'Kathmandu',
    type: 'Full-time',
    description: 'Help new restaurants get started with Resthru. Train users and ensure smooth adoption.',
  },
];

export default function CareersPage() {
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
              Join Our Team
            </h1>
            <p className="mt-6 text-lg text-white/70">
              Help us build the future of restaurant technology in Nepal. We&apos;re looking for passionate people who want to make a real impact.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Why Resthru?
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-8 grid gap-6 sm:grid-cols-2 text-left"
            >
              {[
                { title: 'Meaningful Work', desc: 'Your work directly helps hundreds of restaurants run better businesses.' },
                { title: 'Growth', desc: 'We\'re a growing startup — you\'ll have room to learn and advance quickly.' },
                { title: 'Flexibility', desc: 'Remote-friendly culture with flexible working hours.' },
                { title: 'Impact', desc: 'Join early and shape the product, culture, and direction of the company.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border/70 bg-white p-5 shadow-soft">
                  <h3 className="font-semibold text-primary">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Openings */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-center sm:text-4xl"
          >
            Open Positions
          </motion.h2>
          <div className="mt-12 max-w-3xl mx-auto space-y-4">
            {openings.map((job, idx) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl border border-border/70 bg-white p-6 shadow-soft hover:shadow-soft-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{job.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.department}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.type}</span>
                    </div>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors flex-shrink-0"
                  >
                    Apply <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            Don&apos;t see your role? Send your resume to{' '}
            <a href="mailto:careers@resthru.com" className="text-primary font-medium hover:underline">careers@resthru.com</a>
          </motion.p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
