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
  ChevronRight,
  Command,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Himalayan Kitchen payment failed', type: 'error', time: '2m ago' },
    { id: 2, text: 'New signup: Sagarmatha Palace (Pro)', type: 'success', time: '15m ago' },
    { id: 3, text: 'Pokhara Grill upgraded to Enterprise', type: 'info', time: '1h ago' },
    { id: 4, text: 'Server load at 78%', type: 'warning', time: '2h ago' },
  ]);

  useEffect(() => {
    document.body.classList.add('admin-dark');
    return () => document.body.classList.remove('admin-dark');
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((p) => !p);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commandItems = adminNavItems.map((item) => ({
    ...item,
    keywords: item.label.toLowerCase(),
  }));

  const filteredCommands = searchQuery
    ? commandItems.filter((i) => i.keywords.includes(searchQuery.toLowerCase()))
    : commandItems.slice(0, 6);

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      setCommandOpen(false);
      setSearchQuery('');
    },
    [router]
  );

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin' && pathname.startsWith(href));

  return (
    <div className="flex h-screen overflow-hidden bg-[#060E0A]">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 border-r border-[#25332B] bg-[#090F0C] flex flex-col transition-all duration-300 ease-in-out relative overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-[#25332B] flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#12B877] to-[#0E945E] flex items-center justify-center shadow-lg shadow-[#12B877]/20">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <span className="text-sm font-bold text-white/90 tracking-tight">Resthru</span>
            <span className="text-[10px] font-medium text-[#12B877] block leading-tight">Admin Console</span>
          </div>
        </div>

        {/* Navigation */}
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
                      ? 'bg-[#12B877]/10 text-[#12B877] border-l-2 border-[#12B877]'
                      : 'text-[#768B80] hover:bg-[#1A231E] hover:text-white/80'
                  )}
                >
                  <Icon className="h-4.5 w-4.5 flex-shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#12B877]" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile */}
        <div className="px-3 py-3 border-t border-[#25332B] flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1A231E]/50">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#12B877] to-[#0E945E] flex items-center justify-center text-white font-semibold text-xs shadow-md">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">Super Admin</p>
              <p className="text-xs text-[#768B80] truncate">root@resthru.com</p>
            </div>
            <LogOut className="h-4 w-4 text-[#768B80] hover:text-[#DB3A3A] cursor-pointer transition-colors flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-[#25332B] bg-[#090F0C]/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-[#768B80] hover:text-white hover:bg-[#1A231E] h-9 w-9"
            >
              {sidebarOpen ? <ChevronLeft className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </Button>

            {/* Search */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A231E] border border-[#25332B] text-[#768B80] text-sm hover:border-[#12B877]/30 transition-colors min-w-[240px]"
            >
              <Search className="h-4 w-4" />
              <span>Search anything...</span>
              <span className="ml-auto flex items-center gap-1 text-[10px] bg-[#0D1711] px-1.5 py-0.5 rounded border border-[#25332B]">
                <Command className="h-3 w-3" />K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-[#768B80] hover:text-white hover:bg-[#1A231E] h-9 w-9 relative"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#DB3A3A] text-[9px] font-bold text-white flex items-center justify-center">
                  {notifications.length}
                </span>
              </Button>
              {/* Notification dropdown */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#0D1711] border border-[#25332B] rounded-xl shadow-2xl shadow-black/50 overflow-hidden hidden group-hover:block">
                <div className="p-3 border-b border-[#25332B]">
                  <p className="text-sm font-medium text-white/80">Notifications</p>
                </div>
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#1A231E] transition-colors cursor-pointer">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full mt-1.5 flex-shrink-0',
                        n.type === 'error' && 'bg-[#DB3A3A]',
                        n.type === 'success' && 'bg-[#12B877]',
                        n.type === 'info' && 'bg-[#3B82F6]',
                        n.type === 'warning' && 'bg-[#F4B740]'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70 truncate">{n.text}</p>
                      <p className="text-xs text-[#768B80]">{n.time}</p>
                    </div>
                  </div>
                ))}
                <div className="p-2 border-t border-[#25332B]">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-[#12B877] hover:text-white">
                    View All Notifications
                  </Button>
                </div>
              </div>
            </div>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#25332B]">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#12B877] to-[#0E945E] flex items-center justify-center text-white font-semibold text-xs shadow-md shadow-[#12B877]/10">
                SA
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#768B80] hidden md:block" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#060E0A]">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Command Palette Overlay */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCommandOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#0D1711] border border-[#25332B] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#25332B]">
              <Search className="h-4.5 w-4.5 text-[#768B80]" />
              <input
                autoFocus
                placeholder="Search pages, restaurants, commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-[#768B80] outline-none border-none"
              />
              <kbd className="text-[10px] text-[#768B80] bg-[#1A231E] px-1.5 py-0.5 rounded border border-[#25332B]">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[#768B80] hover:text-white hover:bg-[#12B877]/10 transition-colors text-left group"
                  >
                    <Icon className="h-4.5 w-4.5 group-hover:text-[#12B877]" strokeWidth={1.5} />
                    <span className="group-hover:text-white/90">{item.label}</span>
                    <span className="ml-auto text-[10px] text-[#4A5B52] group-hover:text-[#12B877]">Go to page</span>
                  </button>
                );
              })}
              {filteredCommands.length === 0 && (
                <p className="px-3 py-6 text-sm text-[#768B80] text-center">No results found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
