'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';

const sections = [
  {
    title: 'Acceptance of Terms',
    content: 'By accessing or using Resthru, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our platform.',
  },
  {
    title: 'Description of Service',
    content: 'Resthru is a cloud-based restaurant management platform that provides tools for order management, table management, staff scheduling, inventory tracking, billing, and analytics. Features may vary based on your subscription plan.',
  },
  {
    title: 'Account Registration',
    content: 'You must provide accurate, complete, and current information during registration. You are responsible for safeguarding your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use.',
  },
  {
    title: 'Subscription and Payment',
    content: 'Paid plans are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We reserve the right to modify pricing with 30 days advance notice. Free trial periods may be offered at our discretion.',
  },
  {
    title: 'User Responsibilities',
    content: 'You are responsible for your use of the platform, including all content and data you input. You agree not to use the service for any unlawful purpose, to interfere with the platform\'s operation, or to attempt unauthorized access to any part of the service.',
  },
  {
    title: 'Intellectual Property',
    content: 'Resthru and its content, features, and functionality are owned by Resthru and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.',
  },
  {
    title: 'Data Ownership',
    content: 'You retain all rights to your restaurant data. We will not use your data for purposes other than providing you with our services. You may export or delete your data at any time through your dashboard.',
  },
  {
    title: 'Limitation of Liability',
    content: 'To the maximum extent permitted by law, Resthru shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.',
  },
  {
    title: 'Termination',
    content: 'Either party may terminate this agreement at any time. Upon termination, your right to use the platform ceases immediately. We may retain your data for a reasonable period to allow data export.',
  },
  {
    title: 'Governing Law',
    content: 'These terms are governed by the laws of Nepal. Any disputes shall be resolved in the courts of Kathmandu, Nepal.',
  },
  {
    title: 'Changes to Terms',
    content: 'We reserve the right to modify these terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the platform after changes constitutes acceptance of the new terms.',
  },
  {
    title: 'Contact',
    content: 'For questions about these Terms, contact us at legal@resthru.com.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#064e3b] py-24 sm:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Terms of Service</h1>
            <p className="mt-4 text-white/70">Last updated: July 5, 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground leading-relaxed mb-10"
          >
            These Terms of Service govern your use of the Resthru platform. Please read them carefully before using our services.
          </motion.p>
          <div className="space-y-10">
            {sections.map((section, idx) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <h2 className="text-xl font-bold mb-3">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
