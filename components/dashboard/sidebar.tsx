'use client';

import React, { useMemo, memo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ScrollText,
  ShoppingCart,
  PlusCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SharedNavLink } from '@/components/shared/nav-link';
import type { NavItem } from '@/components/shared/nav-link';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

// A nav entry is either a plain link or a collapsible group with children.
type OwnerNavEntry = NavItem & { children?: { label: string; href: string }[] };

const NAV_ITEMS: OwnerNavEntry[] = [
  { label: 'Dashboard',          href: '/owner',                Icon: LayoutDashboard },
  { label: 'New Order',          href: '/owner/order',          Icon: PlusCircle      },
  { label: 'Orders',             href: '/owner/orders',         Icon: ShoppingCart    },
  {
    label: 'Menu',
    href: '/owner/menu',
    Icon: BookOpen,
    children: [
      { label: 'Dishes',      href: '/owner/menu' },
      { label: 'Category',    href: '/owner/menu/category' },
      { label: 'Combo Offer', href: '/owner/menu/combo' },
    ],
  },
  { label: 'Staff Management',   href: '/owner/staff',          Icon: Users           },
  { label: 'Inventory',          href: '/owner/inventory',      Icon: Package         },
  { label: 'Reports & Analytics',href: '/owner/reports',        Icon: BarChart3       },
  { label: 'Logs',               href: '/owner/logs',           Icon: ScrollText      },
  { label: 'Settings',           href: '/owner/settings',       Icon: Settings        },
];

// ── Collapsible nav group (e.g. "Menu" → Dishes / Category / Combo Offer) ──
const NavGroup = memo(function NavGroup({
  item,
  collapsed,
  pathname,
}: {
  item: OwnerNavEntry;
  collapsed: boolean;
  pathname: string;
}) {
  const { Icon } = item;
  const children = item.children ?? [];
  // A child is active on an exact match, or on any of its own sub-routes. The
  // parent "Dishes" href (/owner/menu) matches exactly so it doesn't light up
  // while on /owner/menu/category or /owner/menu/combo.
  const childActive = useCallback(
    (href: string) =>
      href === '/owner/menu'
        ? pathname === '/owner/menu'
        : pathname === href || pathname.startsWith(href + '/'),
    [pathname]
  );
  const groupActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const [open, setOpen] = useState(groupActive);

  // Keep the group open whenever one of its routes is active.
  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  // Collapsed (icons-only) rail: the group icon just links to the first child.
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={children[0]?.href ?? item.href} prefetch={true}>
            <div
              className={cn(
                'group flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-150 cursor-pointer',
                groupActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
              )}
            >
              <Icon className="flex-shrink-0 h-[18px] w-[18px]" />
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150',
          groupActive
            ? 'text-white'
            : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
        )}
      >
        <Icon
          className={cn(
            'flex-shrink-0 h-[18px] w-[18px]',
            groupActive ? 'text-white' : 'text-white/50 group-hover:text-white'
          )}
        />
        <span className="flex-1 text-left text-[13px] font-medium whitespace-nowrap leading-none">
          {item.label}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-transform duration-200',
            open ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5 pl-3">
          {children.map((child) => {
            const active = childActive(child.href);
            return (
              <Link key={child.href} href={child.href} prefetch={true}>
                <div
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg pl-4 pr-3 py-2 transition-all duration-150 cursor-pointer',
                    active
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full flex-shrink-0',
                      active ? 'bg-white' : 'bg-white/50'
                    )}
                  />
                  <span className="text-[13px] font-medium whitespace-nowrap leading-none">
                    {child.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ── Main sidebar — memo prevents re-render when parent re-renders
//    for reasons unrelated to sidebar state.
const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { user, restaurant, logout } = useAuthStore();

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // The desktop "collapsed" (icons-only) appearance must never apply while the
  // mobile drawer is open — a drawer always shows full labels.
  const collapsed = sidebarCollapsed && !mobileMenuOpen;

  const userInitials = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }, [user?.firstName, user?.lastName]);

  // Stable isActive — uses useCallback so NavLink memo comparisons work.
  const isActive = useCallback(
    (href: string) => {
      if (href === '/owner') return pathname === '/owner';
      return pathname === href || pathname.startsWith(href + '/');
    },
    [pathname]
  );

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen flex flex-col z-50',
          'bg-gradient-to-b from-gray-950 to-gray-900 border-r border-white/5',
          // Mobile: off-canvas drawer that slides in; always full-width labels.
          'w-[248px] transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always on-screen, width collapses to icons.
          'md:translate-x-0 md:transition-[width]',
          sidebarCollapsed ? 'md:w-[68px]' : 'md:w-[248px]'
        )}
      >
        {/* ── Logo ── */}
        <div
          className={cn(
            'flex items-center gap-3 px-4 h-16 border-b border-white/5 flex-shrink-0',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="flex-shrink-0 bg-primary/15 p-1.5 rounded-lg">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Resthru</p>
                <p className="text-xs text-white/40 truncate">
                  {restaurant?.name || 'My Restaurant'}
                </p>
              </div>
              <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                Pro
              </Badge>
            </>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav
          className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5"
          onClick={() => setMobileMenuOpen(false)}
        >
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <NavGroup
                key={item.label}
                item={item}
                collapsed={collapsed}
                pathname={pathname}
              />
            ) : (
              <SharedNavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
              />
            )
          )}
        </nav>

        {/* ── Bottom: user + collapse ── */}
        <div className="flex-shrink-0 border-t border-white/5 p-2 space-y-1">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-primary/30 text-primary text-[11px] font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : 'Account'}
                </p>
                <p className="text-[11px] text-white/40 truncate">
                  {user?.role === 'RESTAURANT_OWNER' || user?.role === 'STAFF' ? 'Owner' : user?.role || 'Owner'}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="h-7 w-7 text-white/40 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="w-10 h-10 mx-auto flex text-white/40 hover:text-red-400 hover:bg-red-400/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              'hidden md:flex w-full h-8 text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors',
              sidebarCollapsed && 'px-0 justify-center'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <span className="flex items-center gap-2 text-[11px]">
                <ChevronLeft className="h-4 w-4" />
                Collapse
              </span>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
});

export default Sidebar;
