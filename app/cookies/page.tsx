'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';

const sections = [
  {
    title: 'What Are Cookies',
    content: 'Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to website owners.',
  },
  {
    title: 'How We Use Cookies',
    content: 'We use cookies for several purposes: to remember your preferences, to understand how you use our platform, to improve our services, and to ensure the security of your account.',
  },
  {
    title: 'Types of Cookies We Use',
    content: 'Essential cookies: Required for the platform to function properly (authentication, security). Analytics cookies: Help us understand how visitors interact with our platform. Preference cookies: Remember your settings and preferences. Marketing cookies: Used to deliver relevant advertisements.',
  },
  {
    title: 'Third-Party Cookies',
    content: 'Some cookies are placed by third-party services that appear on our pages, such as analytics providers (e.g., Google Analytics) and payment processors. We do not control these third-party cookies.',
  },
  {
    title: 'Managing Cookies',
    content: 'You can control and manage cookies through your browser settings. Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites. Note that disabling cookies may affect the functionality of our platform.',
  },
  {
    title: 'Browser-Specific Instructions',
    content: 'Chrome: Settings > Privacy and Security > Cookies. Firefox: Options > Privacy & Security > Cookies. Safari: Preferences > Privacy > Cookies. Edge: Settings > Privacy, Search, and Services > Cookies.',
  },
  {
    title: 'Changes to This Policy',
    content: 'We may update our Cookie Policy from time to time. We will notify you of any significant changes by posting the new policy on this page.',
  },
  {
    title: 'Contact Us',
    content: 'If you have questions about our use of cookies, please contact us at privacy@resthru.com.',
  },
];

export default function CookiesPage() {
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
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Cookie Policy</h1>
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
            This Cookie Policy explains how Resthru uses cookies and similar technologies when you visit our website and use our platform.
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
