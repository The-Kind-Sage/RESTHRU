'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  Settings,
  HelpCircle,
  User,
  ShoppingCart,
  AlertTriangle,
  Receipt,
  Info,
  CheckCheck,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationsStore, AppNotification } from '@/store/notifications-store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/orders': 'Live Orders',
  '/dashboard/tables': 'Table Map',
  '/dashboard/menu': 'Menu Management',
  '/dashboard/staff': 'Staff Management',
  '/dashboard/shifts': 'Shift Management',
  '/dashboard/invoices': 'Invoice History',
  '/dashboard/inventory': 'Inventory',
  '/dashboard/reports': 'Reports & Analytics',
  '/dashboard/prints': 'Print Center',
  '/dashboard/settings': 'Settings',
};

const NOTIF_ICONS: Record<AppNotification['type'], React.ReactNode> = {
  order:  <ShoppingCart className="h-4 w-4 text-primary" />,
  stock:  <AlertTriangle className="h-4 w-4 text-warning" />,
  bill:   <Receipt className="h-4 w-4 text-success" />,
  system: <Info className="h-4 w-4 text-muted-foreground" />,
};

function NotificationItem({
  notification,
  onRead,
  onDismiss,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer',
        !notification.isRead && 'bg-primary/5'
      )}
      onClick={() => !notification.isRead && onRead(notification.id)}
    >
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        {NOTIF_ICONS[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !notification.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Unread dot + dismiss */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        {!notification.isRead && (
          <span className="h-2 w-2 rounded-full bg-primary mt-1" />
        )}
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, setMobileMenuOpen } = useUIStore();
  const { user, restaurant, logout } = useAuthStore();
  const { notifications, unreadCount, isLoading, fetch, markRead, markAllRead, dismiss } = useNotificationsStore();

  const pageTitle = useMemo(() => PAGE_TITLES[pathname] || 'Dashboard', [pathname]);
  const todayDate = useMemo(() => format(new Date(), 'MMMM d, yyyy'), []);
  const userInitials = useMemo(() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }, [user]);

  // Fetch notifications when restaurant is known
  useEffect(() => {
    if (restaurant?.id) {
      fetch(restaurant.id);
    }
  }, [restaurant?.id, fetch]);

  const handleMarkAllRead = useCallback(() => {
    if (restaurant?.id) markAllRead(restaurant.id);
  }, [restaurant?.id, markAllRead]);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-card border-b border-border flex items-center px-4 gap-3 z-40 transition-all duration-300',
        sidebarCollapsed ? 'left-[68px]' : 'left-[248px]'
      )}
    >
      {/* Left: mobile toggle + page title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden flex-shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight">{pageTitle}</h1>
          <p className="text-xs text-muted-foreground">{todayDate}</p>
        </div>
      </div>

      {/* Center: search */}
      <div className="hidden md:flex flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, menu, staff..."
            className="pl-9 h-9 bg-background text-sm"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* ── Notification Bell ── */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[360px] p-0 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-0 text-[11px] h-5 px-1.5">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
            </div>

            {/* List */}
            <ScrollArea className="max-h-[420px]">
              {isLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-14 flex flex-col items-center gap-2 text-muted-foreground">
                  <Bell className="h-8 w-8 opacity-20" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs">No notifications right now.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onRead={markRead}
                      onDismiss={dismiss}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="px-4 py-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => router.push('/dashboard/settings')}
                  >
                    Notification settings
                  </Button>
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-2 hover:bg-accent">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" /> Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
