import Link from 'next/link';
import { UtensilsCrossed, Facebook, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = {
    product: {
      title: 'Product',
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'QR Menu', href: '/#features' },
      ],
    },
    company: {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Blog', href: '/blog' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    legal: {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
      ],
    },
    support: {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Documentation', href: '/docs' },
        { label: 'Status', href: '/status' },
        { label: 'API', href: '/api' },
      ],
    },
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/resthru', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/resthru', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/resthru', label: 'LinkedIn' },
  ];

  return (
    <footer id="contact" className="border-t border-border bg-gradient-to-b from-primary to-primary-hover">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Logo */}
        <div className="mb-6 sm:mb-8 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            <span className="text-lg sm:text-xl font-bold text-white">Resthru</span>
          </div>
          <p className="text-xs sm:text-sm text-white/70">
            Run Smarter. Serve Better.
          </p>
        </div>

        {/* Link columns: 2 cols on mobile, 4 on md */}
        <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-4">
          {Object.values(footerSections).map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold text-white uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-5 sm:py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <a
              href="mailto:hello@resthru.com"
              className="text-xs sm:text-sm text-white/60 transition-colors hover:text-white"
            >
              hello@resthru.com
            </a>

            <div className="flex items-center gap-3 sm:gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 transition-colors hover:text-white"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                );
              })}
            </div>

            <div className="flex flex-col items-center sm:items-end gap-1 text-center sm:text-right text-xs sm:text-xs text-white/60">
              <p>{currentYear} Resthru. All rights reserved.</p>
              <p>Made with heart in Nepal</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
