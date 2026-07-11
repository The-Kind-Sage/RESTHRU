'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Code, Key, Webhook, Lock, ArrowRight, Copy, AlertCircle } from 'lucide-react';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/restaurants',
    description: 'List all restaurants for the authenticated user.',
  },
  {
    method: 'GET',
    path: '/api/v1/restaurants/:id',
    description: 'Get details for a specific restaurant.',
  },
  {
    method: 'POST',
    path: '/api/v1/orders',
    description: 'Create a new order.',
  },
  {
    method: 'GET',
    path: '/api/v1/orders',
    description: 'List orders with optional filters.',
  },
  {
    method: 'PATCH',
    path: '/api/v1/orders/:id',
    description: 'Update an existing order.',
  },
  {
    method: 'GET',
    path: '/api/v1/menu',
    description: 'Get the full menu for a restaurant.',
  },
  {
    method: 'GET',
    path: '/api/v1/tables',
    description: 'List tables and their status.',
  },
  {
    method: 'POST',
    path: '/api/v1/tables/:id/checkout',
    description: 'Process checkout for a table.',
  },
];

const features = [
  {
    icon: Key,
    title: 'API Keys',
    description: 'Generate and manage API keys from your dashboard settings. Each key can be scoped to specific permissions.',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description: 'Receive real-time notifications when events occur — new orders, status changes, and more.',
  },
  {
    icon: Lock,
    title: 'Authentication',
    description: 'All API requests require authentication via API key or OAuth 2.0 bearer token.',
  },
  {
    icon: Code,
    title: 'SDKs',
    description: 'Official SDKs coming soon for JavaScript, Python, and PHP.',
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-success/10 text-success',
  POST: 'bg-info/10 text-info',
  PATCH: 'bg-warning/10 text-warning',
  DELETE: 'bg-destructive/10 text-destructive',
};

export default function ApiPage() {
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
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">API Reference</h1>
            <p className="mt-4 text-lg text-white/70">Integrate Resthru into your own applications with our REST API.</p>
            <div className="mt-6 flex items-center gap-2">
              <code className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white font-mono">Base URL: https://api.resthru.com/v1</code>
              <button
                onClick={() => navigator.clipboard.writeText('https://api.resthru.com/v1')}
                className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20 transition-colors"
                title="Copy"
              >
                <Copy className="h-4 w-4 text-white" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong className="font-semibold">Planned, not yet available</strong> — the public REST
              API is on our roadmap. The endpoints below describe the intended surface and cannot be
              called against a live server yet.
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm">{feature.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl font-bold text-center mb-10">
            Endpoints
          </motion.h2>
          <div className="rounded-2xl border border-border/70 bg-white shadow-soft overflow-hidden">
            <div className="divide-y divide-border/70">
              {endpoints.map((ep, idx) => (
                <motion.div
                  key={ep.path + ep.method}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold font-mono ${methodColors[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-foreground flex-1">{ep.path}</code>
                  <span className="text-xs text-muted-foreground hidden sm:block">{ep.description}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            Full API documentation with request/response examples coming soon.
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl font-bold">
            Ready to build?
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              Request Early Access <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors"
            >
              Contact Sales
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
