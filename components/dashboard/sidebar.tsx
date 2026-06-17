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
  Bell,
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
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Live Orders', href: '/dashboard/orders', icon: <ShoppingBag className="h-5 w-5" /> },
  { label: 'Table Map', href: '/dashboard/tables', icon: <LayoutGrid className="h-5 w-5" /> },
  { label: 'Menu Management', href: '/dashboard/menu', icon: <ClipboardList className="h-5 w-5" /> },
  { label: 'Staff Management', href: '/dashboard/staff', icon: <Users className="h-5 w-5" /> },
  { label: 'Inventory', href: '/dashboard/inventory', icon: <Package className="h-5 w-5" /> },
  { label: 'Reports & Analytics', href: '/dashboard/reports', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Print Center', href: '/dashboard/prints', icon: <Printer className="h-5 w-5" /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <Settings className="h-5 w-5" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, restaurant } = useAuthStore();
  const userInitials = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'RS';
  }, [user]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-muted flex flex-col transition-all duration-300 ease-in-out z-50',
          sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {/* Top Section */}
        <div className="flex flex-col border-b border-sidebar-muted">
          {/* Logo */}
          <div className="h-20 px-4 py-4 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
              </div>
              {!sidebarCollapsed && (
                <span className="font-bold text-lg text-sidebar-foreground whitespace-nowrap">
                  Resthru
                </span>
              )}
            </div>
          </div>

          {/* Restaurant Info */}
          {!sidebarCollapsed && (
            <div className="px-4 pb-4">
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {restaurant?.name || 'Restaurant'}
              </div>
              <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-primary/20">
                Pro
              </Badge>
            </div>
          )}

          {/* Collapse Toggle */}
          <div className="px-4 py-3 border-t border-sidebar-muted">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="w-full h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-5 w-5" />
                  ) : (
                    <ChevronLeft className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {sidebarCollapsed ? 'Expand' : 'Collapse'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <div
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200',
                          active
                            ? 'border-l-2 border-primary bg-sidebar-accent/10 text-sidebar-accent'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-muted'
                        )}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        {!sidebarCollapsed && (
                          <span className="text-sm font-medium whitespace-nowrap flex-1">
                            {item.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-sidebar-muted p-3 space-y-3">
          {/* User Profile */}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-8 w-8 bg-primary/20">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.role || 'Staff'}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-1 h-9 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-9 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Notifications</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
