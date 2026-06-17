'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  Settings,
  HelpCircle,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/orders': 'Live Orders',
  '/dashboard/tables': 'Table Map',
  '/dashboard/menu': 'Menu Management',
  '/dashboard/staff': 'Staff Management',
  '/dashboard/inventory': 'Inventory',
  '/dashboard/reports': 'Reports & Analytics',
  '/dashboard/prints': 'Print Center',
  '/dashboard/settings': 'Settings',
};

export default function TopHeader() {
  const pathname = usePathname();
  const { sidebarCollapsed, setMobileMenuOpen } = useUIStore();
  const { user } = useAuthStore();

  const pageTitle = useMemo(() => {
    return PAGE_TITLES[pathname] || 'Dashboard';
  }, [pathname]);

  const todayDate = useMemo(() => {
    return format(new Date(), 'MMMM d, yyyy');
  }, []);

  const userInitials = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'RS';
  }, [user]);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-card border-b border-border flex items-center px-6 gap-4 z-40 transition-all duration-300',
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      )}
    >
      {/* Left: Mobile Menu Toggle + Page Title */}
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{todayDate}</p>
        </div>
      </div>

      {/* Center: Search Bar (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, menu, staff..."
            className="pl-10 h-10 bg-background"
          />
        </div>
      </div>

      {/* Right: Quick Actions + Notifications + User Menu */}
      <div className="flex items-center gap-3">
        {/* New Order Button */}
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-3"
        >
          <span className="hidden sm:inline">+ New Order</span>
          <span className="sm:hidden">+</span>
        </Button>

        {/* Notification Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
        </div>

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-2 hover:bg-accent"
            >
              <Avatar className="h-8 w-8 bg-indigo-500/20">
                <AvatarFallback className="bg-indigo-500/20 text-indigo-600 text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
