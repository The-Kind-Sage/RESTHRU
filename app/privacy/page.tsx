'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';

const sections = [
  {
    title: 'Information We Collect',
    content: 'We collect information you provide directly, such as when you create an account, fill out a form, or contact us. This includes your name, email address, phone number, restaurant details, and payment information.',
  },
  {
    title: 'How We Use Your Information',
    content: 'We use your information to provide and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and promotions.',
  },
  {
    title: 'Information Sharing',
    content: 'We do not sell your personal information. We may share your information with trusted third-party service providers who assist us in operating our platform, conducting our business, or serving you, as long as they agree to keep this information confidential.',
  },
  {
    title: 'Data Security',
    content: 'We implement industry-standard security measures including SSL encryption, secure data storage, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.',
  },
  {
    title: 'Cookies',
    content: 'We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.',
  },
  {
    title: 'Data Retention',
    content: 'We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.',
  },
  {
    title: 'Your Rights',
    content: 'You have the right to access, correct, or delete your personal information. You can update your account information at any time through your dashboard settings, or contact us for assistance.',
  },
  {
    title: 'Children\'s Privacy',
    content: 'Our service is not intended for use by children under 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.',
  },
  {
    title: 'Changes to This Policy',
    content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date. We encourage you to review this policy periodically.',
  },
  {
    title: 'Contact Us',
    content: 'If you have questions about this Privacy Policy, please contact us at privacy@resthru.com.',
  },
];

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Privacy Policy</h1>
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
            At Resthru, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
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
