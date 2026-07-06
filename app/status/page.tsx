'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';

const services = [
  { name: 'API', status: 'operational', uptime: '99.99%' },
  { name: 'Web Dashboard', status: 'operational', uptime: '99.98%' },
  { name: 'QR Menu Service', status: 'operational', uptime: '99.99%' },
  { name: 'Authentication', status: 'operational', uptime: '99.99%' },
  { name: 'Database', status: 'operational', uptime: '99.99%' },
  { name: 'Email Notifications', status: 'operational', uptime: '99.95%' },
  { name: 'File Storage', status: 'operational', uptime: '99.99%' },
];

const incidents = [
  {
    date: 'June 28, 2025',
    title: 'Scheduled Maintenance',
    description: 'Database optimization completed successfully. No downtime experienced.',
    resolved: true,
  },
  {
    date: 'May 15, 2025',
    title: 'API Latency Spike',
    description: 'Brief period of elevated API response times. Root cause identified and resolved.',
    resolved: true,
  },
];

const statusColors: Record<string, string> = {
  operational: 'text-success',
  degraded: 'text-warning',
  down: 'text-destructive',
};

const statusIcons: Record<string, React.ReactNode> = {
  operational: <CheckCircle2 className="w-5 h-5 text-success" />,
  degraded: <AlertCircle className="w-5 h-5 text-warning" />,
  down: <AlertCircle className="w-5 h-5 text-destructive" />,
};

export default function StatusPage() {
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
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">System Status</h1>
            <p className="mt-4 text-lg text-white/70">Real-time status of all Resthru services.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Overall Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-success/30 bg-success/5 p-6 mb-10"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <h2 className="text-lg font-bold text-success">All Systems Operational</h2>
                <p className="text-sm text-muted-foreground">All services are running normally.</p>
              </div>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border/70 bg-white shadow-soft overflow-hidden"
          >
            <div className="p-5 border-b border-border/70">
              <h3 className="font-bold">Services</h3>
            </div>
            <div className="divide-y divide-border/70">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    {statusIcons[service.status]}
                    <span className="font-medium text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Uptime: {service.uptime}</span>
                    <span className={`font-medium capitalize ${statusColors[service.status]}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Past Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 rounded-2xl border border-border/70 bg-white shadow-soft overflow-hidden"
          >
            <div className="p-5 border-b border-border/70">
              <h3 className="font-bold">Past Incidents</h3>
            </div>
            <div className="divide-y divide-border/70">
              {incidents.map((incident) => (
                <div key={incident.title} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{incident.date}</span>
                    {incident.resolved && (
                      <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                        Resolved
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm">{incident.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{incident.description}</p>
                </div>
              ))}
              {incidents.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No recent incidents. Everything is running smoothly.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
