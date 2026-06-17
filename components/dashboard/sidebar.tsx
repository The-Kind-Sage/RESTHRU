'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  LayoutGrid,
  ClipboardList,
  Users,
  Package,
  BarChart3,
  Printer,
  Settings,
  LogOut,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',         href: '/dashboard',          icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
  { label: 'Live Orders',       href: '/dashboard/orders',   icon: <ShoppingBag className="h-[18px] w-[18px]" /> },
  { label: 'Table Map',         href: '/dashboard/tables',   icon: <LayoutGrid className="h-[18px] w-[18px]" /> },
  { label: 'Menu Management',   href: '/dashboard/menu',     icon: <ClipboardList className="h-[18px] w-[18px]" /> },
  { label: 'Staff Management',  href: '/dashboard/staff',    icon: <Users className="h-[18px] w-[18px]" /> },
  { label: 'Inventory',         href: '/dashboard/inventory',icon: <Package className="h-[18px] w-[18px]" /> },
  { label: 'Reports & Analytics',href: '/dashboard/reports', icon: <BarChart3 className="h-[18px] w-[18px]" /> },
  { label: 'Print Center',      href: '/dashboard/prints',   icon: <Printer className="h-[18px] w-[18px]" /> },
  { label: 'Settings',          href: '/dashboard/settings', icon: <Settings className="h-[18px] w-[18px]" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, restaurant, logout } = useAuthStore();

  const userInitials = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }, [user]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 ease-in-out',
          'bg-gradient-to-b from-gray-950 to-gray-900 border-r border-white/5',
          sidebarCollapsed ? 'w-[68px]' : 'w-[248px]'
        )}
      >
        {/* ── Logo ── */}
        <div className={cn(
          'flex items-center gap-3 px-4 h-16 border-b border-white/5 flex-shrink-0',
          sidebarCollapsed && 'justify-center px-0'
        )}>
          <div className="flex-shrink-0 bg-primary/15 p-1.5 rounded-lg">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">Resthru</p>
              <p className="text-xs text-white/40 truncate">{restaurant?.name || 'My Restaurant'}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
              Pro
            </Badge>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        'group flex items-center gap-3 rounded-lg transition-all duration-150 cursor-pointer',
                        sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5',
                        active
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'text-white/50 hover:text-white hover:bg-white/8'
                      )}
                    >
                      <span className={cn('flex-shrink-0', active ? 'text-white' : 'text-white/50 group-hover:text-white')}>
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <span className="text-[13px] font-medium whitespace-nowrap leading-none">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* ── Bottom: user + collapse ── */}
        <div className="flex-shrink-0 border-t border-white/5 p-2 space-y-1">
          {/* User row */}
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-primary/30 text-primary text-[11px] font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Account'}
                </p>
                <p className="text-[11px] text-white/40 truncate">{user?.role || 'Owner'}</p>
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

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              'w-full h-8 text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors',
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
}
