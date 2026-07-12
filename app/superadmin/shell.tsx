'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, CreditCard, TrendingUp,
  Headphones, Activity, Users, Megaphone, ShieldCheck,
  Wallet, Settings, FlaskConical, Bell, ChevronLeft,
  Menu, Command, LogOut, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { logout, getCurrentUser } from '@/lib/actions/auth';
import { unregisterServiceWorker } from '@/lib/service-worker';
import { getUnreadNotificationCount } from '@/lib/actions/admin';
import { AdminBreadcrumbs } from '@/components/superadmin/breadcrumbs';

// ── Lazy-load the command palette — it's heavy (all 12 nav icon refs +
//    keyboard handler + overlay) and only needed when Cmd+K is pressed.
const AdminCommandPalette = dynamic(
  () => import('@/components/superadmin/command-palette'),
  { ssr: false }
);

const adminNavItems = [
  { label: 'Dashboard',      icon: LayoutDashboard, href: '/superadmin'               },
  { label: 'Restaurants',    icon: Building2,        href: '/superadmin/restaurants'   },
  { label: 'Subscriptions',  icon: CreditCard,       href: '/superadmin/subscriptions' },
  { label: 'Analytics',      icon: TrendingUp,       href: '/superadmin/analytics'     },
  { label: 'Support Center', icon: Headphones,       href: '/superadmin/support'       },
  { label: 'System Health',  icon: Activity,         href: '/superadmin/health'        },
  { label: 'Sales Pipeline', icon: Users,            href: '/superadmin/pipeline'      },
  { label: 'Marketing Tools',icon: Megaphone,        href: '/superadmin/marketing'     },
  { label: 'Compliance',     icon: ShieldCheck,      href: '/superadmin/compliance'    },
  { label: 'Financials',     icon: Wallet,           href: '/superadmin/financials'    },
  { label: 'Innovation Lab', icon: FlaskConical,     href: '/superadmin/innovation'    },
  { label: 'Settings',       icon: Settings,         href: '/superadmin/settings'      },
];

// ── Memoised nav link so it only re-renders when its active state changes.
const AdminNavLink = memo(function AdminNavLink({
  item,
  active,
}: {
  item: (typeof adminNavItems)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link key={item.href} href={item.href} prefetch={true}>
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          active
            ? 'bg-sidebar-accent/15 text-sidebar-accent border-l-2 border-sidebar-accent'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-muted/30 hover:text-sidebar-foreground'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
        <span className="truncate">{item.label}</span>
        {active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-accent" />
        )}
      </div>
    </Link>
  );
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen]   = useState(false);
  const [adminUser, setAdminUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) setAdminUser(user);
    });
    getUnreadNotificationCount().then(setUnreadCount).catch(() => {});
  }, []);

  const initials    = 'SA';
  const displayName = 'Super Admin';

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = useCallback(
    (href: string) =>
      pathname === href || (href !== '/superadmin' && pathname.startsWith(href)),
    [pathname]
  );

  // Close the mobile drawer whenever the route changes (i.e. after a nav tap).
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await Promise.all([logout(), unregisterServiceWorker()]);
    router.push('/');
  };

  // Login page renders without the admin shell
  if (pathname === '/superadmin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile drawer backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──
         Desktop (lg+): inline column that collapses to 0 width via sidebarOpen.
         Mobile: fixed off-canvas drawer that slides in over a backdrop. */}
      <aside
        className={cn(
          'bg-sidebar flex flex-col border-r border-border overflow-hidden',
          // Mobile: fixed overlay drawer
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static, width-collapsing, always on-screen
          'lg:static lg:z-auto lg:translate-x-0 lg:flex-shrink-0 lg:transition-[width]',
          sidebarOpen ? 'lg:w-64' : 'lg:w-0'
        )}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-muted/30 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-sidebar-foreground font-bold text-sm">R</span>
          </div>
          <div>
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
              Resthru
            </span>
            <span className="text-[10px] font-medium text-sidebar-foreground/70 block leading-tight">
              Admin Console
            </span>
          </div>
        </div>

        <nav
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          {adminNavItems.map((item) => (
            <AdminNavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-muted/20">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-sidebar-foreground font-semibold text-xs">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                Super Admin
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-0 bg-transparent border-none cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-sidebar-foreground/60 hover:text-destructive transition-colors flex-shrink-0" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile: open the off-canvas drawer */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-9 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
            {/* Desktop: collapse / expand the inline sidebar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
              className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-9 hidden lg:flex"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>

            {/* Command palette trigger — renders the heavy overlay lazily */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground text-sm hover:border-primary/30 transition-colors min-w-[240px]"
            >
              <span className="flex-1 text-left">Search anything…</span>
              <span className="flex items-center gap-1 text-[10px] bg-background px-1.5 py-0.5 rounded border border-border">
                <Command className="h-3 w-3" />K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/superadmin/support" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-9"
                title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'No unread notifications'}
              >
                <Bell className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold flex items-center justify-center pointer-events-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-3 border-l border-border cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
                    {initials}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">Super Admin</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/superadmin/settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/superadmin/support" className="cursor-pointer">
                    <Headphones className="h-4 w-4 mr-2" /> Support Center
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="h-10 border-b border-border/60 bg-background flex items-center px-4 lg:px-6 flex-shrink-0">
          <AdminBreadcrumbs />
        </div>

        <main className="flex-1 overflow-auto bg-background">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Lazy-loaded — only mounted when commandOpen === true */}
      {commandOpen && (
        <AdminCommandPalette
          items={adminNavItems}
          onClose={() => setCommandOpen(false)}
        />
      )}
    </div>
  );
}
