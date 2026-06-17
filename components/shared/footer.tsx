import Link from 'next/link';
import { UtensilsCrossed, Facebook, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = {
    product: {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'QR Menu', href: '#qr-menu' },
        { label: 'Offline Mode', href: '#offline-mode' },
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
    {
      icon: Facebook,
      href: 'https://facebook.com/resthru',
      label: 'Facebook',
    },
    {
      icon: Instagram,
      href: 'https://instagram.com/resthru',
      label: 'Instagram',
    },
    {
      icon: Linkedin,
      href: 'https://linkedin.com/company/resthru',
      label: 'LinkedIn',
    },
  ];

  return (
    <footer className="border-t border-border bg-primary">
      {/* Top Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-5">
          {/* Logo and Tagline */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-white">Resthru</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Run Smarter. Serve Better.
            </p>
          </div>

          {/* Link Columns */}
          {Object.values(footerSections).map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold text-white">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-white"
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

      {/* Bottom Section */}
      <div className="border-t border-border bg-primary-hover">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Left: Contact Email */}
            <a
              href="mailto:hello@resthru.com"
              className="text-sm text-muted-foreground transition-colors hover:text-white"
            >
              hello@resthru.com
            </a>

            {/* Center: Social Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-white"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>

            {/* Right: Copyright and Made With */}
            <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
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
