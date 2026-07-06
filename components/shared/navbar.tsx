'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, Menu, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoginModal } from '@/components/shared/login-modal';
import { RegisterModal } from '@/components/shared/register-modal';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleLogin = () => setLoginOpen(true);
    const handleRegister = () => setRegisterOpen(true);
    document.addEventListener('open-login', handleLogin);
    document.addEventListener('open-register', handleRegister);
    return () => {
      document.removeEventListener('open-login', handleLogin);
      document.removeEventListener('open-register', handleRegister);
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#about', label: 'About' },
    { href: '/#contact', label: 'Contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    if (pathname === '/') {
      const anchor = href.replace('/', '');
      const element = document.querySelector(anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = href;
    }
  };

  return (
    <>
      <nav
        suppressHydrationWarning
        className={cn(
          'sticky top-0 z-50 w-full transition-[background-color,box-shadow,backdrop-filter] duration-300',
          isScrolled || mobileOpen
            ? 'bg-background/95 backdrop-blur-xl shadow-sm'
            : 'bg-transparent'
        )}
      >
        {/* Desktop */}
        <div className="hidden md:block mx-auto max-w-7xl px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/80 px-5 py-2.5 shadow-sm backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <UtensilsCrossed className="h-[18px] w-[18px] text-primary" />
              </div>
              <span className="text-base font-bold tracking-tight text-primary">Resthru</span>
            </Link>

            <div className="flex items-center gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-[13px] font-medium text-foreground/70 transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="rounded-lg px-4 py-2 text-[13px] font-medium text-foreground/70 transition-colors hover:text-primary hover:bg-primary/5"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setRegisterOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-primary-hover"
              >
                Start Free Trial
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-tight text-primary">Resthru</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 bg-background px-4 pb-4">
            <div className="flex flex-col gap-1 py-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
              <button
                type="button"
                onClick={() => { setMobileOpen(false); setLoginOpen(true); }}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setMobileOpen(false); setRegisterOpen(true); }}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        )}
      </nav>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => setLoginOpen(true)}
      />
    </>
  );
};

export default Navbar;
