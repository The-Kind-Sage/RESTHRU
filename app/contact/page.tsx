'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MapPin, Send, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { contactFormSchema, submitContactMessage, type ContactFormData } from '@/lib/actions/contact';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email',
    value: 'hello@resthru.com',
    description: 'We reply within 24 hours',
  },
  {
    icon: MapPin,
    title: 'Office',
    value: 'Kathmandu, Nepal',
    description: 'Come say hello',
  },
];

const faqItems = [
  {
    question: 'How do I get started?',
    answer: 'Click "Start Free Trial" and follow the 5-step registration. Your restaurant can be up and running in under 5 minutes.',
  },
  {
    question: 'Do you offer demos?',
    answer: 'Yes! Contact us to schedule a personalized demo. We\'ll walk you through all the features for your restaurant.',
  },
  {
    question: 'What support do you provide?',
    answer: 'We offer email support for all plans, with priority support for Growth and Enterprise customers get dedicated phone support.',
  },
];

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      const result = await submitContactMessage(data);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Message sent! We\'ll get back to you soon.');
      form.reset();
    } catch {
      toast.error('Something went wrong. Please try again or email us directly.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="px-4 pt-20 pb-6 sm:px-6 lg:px-8 sm:pt-28 sm:pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Contact
            </p>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Get in Touch
            </h1>
            <p className="mx-auto max-w-lg text-base text-muted-foreground">
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact cards */}
      <section className="px-4 pb-6 sm:px-6 lg:px-8 sm:pb-10">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid gap-2.5 sm:grid-cols-2 sm:gap-4"
          >
            {contactInfo.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-primary/15 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/8 transition-colors group-hover:bg-primary/12">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{item.title}</p>
                    <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="px-4 pb-12 sm:px-6 lg:px-8 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="rounded-2xl border border-border/60 bg-card p-7">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Send a Message</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Fill out the form and we&apos;ll get back to you.</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" disabled={isLoading} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" disabled={isLoading} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="How can we help?" disabled={isLoading} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us more about your question or feedback..."
                              className="min-h-[120px]"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-primary-hover text-white"
                    >
                      {isLoading ? (
                        'Sending...'
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </motion.div>

            {/* FAQ sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="sticky top-28 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Common Questions</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Quick answers to frequently asked questions.
                  </p>
                </div>

                {faqItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/60 bg-card p-5"
                  >
                    <h3 className="text-sm font-semibold text-foreground">{item.question}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                  </div>
                ))}

                <div className="rounded-xl border border-primary/15 bg-primary/5 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-primary">Why Resthru?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      Setup in under 5 minutes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      No credit card required
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      Dedicated support team
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-10 sm:px-6 lg:px-8 sm:py-16 bg-gradient-to-b from-background to-primary/[0.03]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Join hundreds of restaurants already using Resthru.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all hover:bg-primary-hover"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
