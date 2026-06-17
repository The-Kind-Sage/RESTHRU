'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  TrendingUp,
  Headphones,
  Activity,
  Users,
  Megaphone,
  ShieldCheck,
  Wallet,
  Settings,
  FlaskConical,
  Search,
  Bell,
  ChevronLeft,
  Menu,
  Command,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logout, getCurrentUser } from '@/lib/actions/auth';

const adminNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Restaurants', icon: Building2, href: '/admin/restaurants' },
  { label: 'Subscriptions', icon: CreditCard, href: '/admin/subscriptions' },
  { label: 'Analytics', icon: TrendingUp, href: '/admin/analytics' },
  { label: 'Support Center', icon: Headphones, href: '/admin/support' },
  { label: 'System Health', icon: Activity, href: '/admin/health' },
  { label: 'Sales Pipeline', icon: Users, href: '/admin/pipeline' },
  { label: 'Marketing Tools', icon: Megaphone, href: '/admin/marketing' },
  { label: 'Compliance', icon: ShieldCheck, href: '/admin/compliance' },
  { label: 'Financials', icon: Wallet, href: '/admin/financials' },
  { label: 'Innovation Lab', icon: FlaskConical, href: '/admin/innovation' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState<{ id: number; text: string; type: 'error' | 'success' | 'info' | 'warning'; time: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);

  useEffect(() => {
    document.body.classList.add('admin-layout');
    return () => document.body.classList.remove('admin-layout');
  }, []);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setCurrentUser(u);
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((p) => !p);
      }
      if (e.key === 'Escape') { setCommandOpen(false); setSearchQuery(''); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredCommands = searchQuery
    ? adminNavItems.filter((i) => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : adminNavItems.slice(0, 6);

  const handleNavigate = useCallback((href: string) => {
    router.push(href);
    setCommandOpen(false);
    setSearchQuery('');
  }, [router]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href));

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = currentUser
    ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`
    : 'SA';

  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : 'Super Admin';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'flex-shrink-0 border-r border-border bg-sidebar flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-muted/30 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-sidebar-foreground font-bold text-sm">R</span>
          </div>
          <div>
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">Resthru</span>
            <span className="text-[10px] font-medium text-sidebar-foreground/70 block leading-tight">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-sidebar-accent/15 text-sidebar-accent border-l-2 border-sidebar-accent'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-muted/30 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-4.5 w-4.5 flex-shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{item.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-accent" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-muted/20">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-sidebar-foreground font-semibold text-xs">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{currentUser?.email || 'admin@resthru.com'}</p>
            </div>
            <button onClick={handleLogout} className="p-0 bg-transparent border-none cursor-pointer">
              <LogOut className="h-4 w-4 text-sidebar-foreground/60 hover:text-destructive transition-colors flex-shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-9"
            >
              {sidebarOpen ? <ChevronLeft className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </Button>

            <button
              onClick={() => setCommandOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground text-sm hover:border-primary/30 transition-colors min-w-[240px]"
            >
              <Search className="h-4 w-4" />
              <span>Search anything...</span>
              <span className="ml-auto flex items-center gap-1 text-[10px] bg-background px-1.5 py-0.5 rounded border border-border">
                <Command className="h-3 w-3" />K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-9 relative"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                  {notifications.length}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
                {initials}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {commandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCommandOpen(false)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-soft-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-4.5 w-4.5 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search pages, restaurants, commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none"
              />
              <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors text-left group"
                  >
                    <Icon className="h-4.5 w-4.5 group-hover:text-primary" strokeWidth={1.5} />
                    <span className="group-hover:text-foreground">{item.label}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60 group-hover:text-primary">Go to page</span>
                  </button>
                );
              })}
              {filteredCommands.length === 0 && (
                <p className="px-3 py-6 text-sm text-muted-foreground text-center">No results found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
