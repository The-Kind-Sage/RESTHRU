'use client';

import React, { useState } from 'react';
import { Search, X, Users, WifiOff, ClipboardList, UtensilsCrossed, LogOut, UserRound, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import { useOrderSync } from '@/hooks/useOrderSync';
import { useReadyNotifications } from '@/hooks/useReadyNotifications';
import { logout } from '@/lib/actions/auth';
import type { PosView } from './OrderPageClient';

export interface PosCategory {
  id: string;
  name: string;
}

export default function OrderHeader({
  categories,
  view,
  onViewChange,
  waiterName,
}: {
  categories: PosCategory[];
  view: PosView;
  onViewChange: (view: PosView) => void;
  waiterName: string;
}) {
  // Initialize sync and offline listeners
  useOrderSync();
  // Poll for ORDER_READY notifications from the kitchen
  useReadyNotifications();

  const {
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    tableNumber, guestCount,
    isOffline, orderState
  } = useWaiterOrderStore();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    // Clear this station's persisted draft so the next waiter to sign in on a
    // shared device doesn't inherit the previous waiter's table/order.
    try {
      localStorage.removeItem('waiter-order-storage');
    } catch {
      // localStorage may be unavailable (private mode) — safe to ignore.
    }
    await logout();
    // Full navigation so no in-memory store state carries into the next session.
    window.location.assign('/order/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-card border-b border-border shadow-sm pt-safe-top">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-destructive text-destructive-foreground text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2">
          <WifiOff size={14} />
          <span>Offline - Saving locally</span>
        </div>
      )}

      {/* Waiter identity + sign-out. Thin strip so it's clear who's signed in on
          a shared station and easy to hand off between waiters. */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-1.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <UserRound size={13} className="flex-shrink-0" />
          <span className="truncate">{waiterName}</span>
        </span>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
        >
          {loggingOut ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
          <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>

      {/* Top Bar: Table Info, View Toggle & Live Status */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex items-center gap-2 bg-muted hover:bg-muted/80 transition-colors px-3 py-1.5 rounded-full"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-table-selector'));
          }}
        >
          <span className="font-bold text-foreground">
            Table {tableNumber || '??'}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground text-sm border-l border-border pl-2">
            <Users size={14} />
            <span>{guestCount}</span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {orderState !== 'DRAFT' && view === 'menu' && (
            <Badge variant={orderState === 'LIVE_TRACKING' ? 'default' : 'secondary'} className="animate-pulse">
              {orderState === 'LIVE_TRACKING' ? 'Kitchen Prepping' : 'Order Sent'}
            </Badge>
          )}
          <button
            onClick={() => onViewChange(view === 'menu' ? 'orders' : 'menu')}
            className="flex items-center gap-1.5 bg-primary/10 text-primary font-semibold text-sm px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
          >
            {view === 'menu' ? (
              <>
                <ClipboardList size={16} />
                Orders
              </>
            ) : (
              <>
                <UtensilsCrossed size={16} />
                Menu
              </>
            )}
          </button>
        </div>
      </div>

      {view === 'menu' && (
        <>
          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Search items or codes (e.g. 05)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 text-base bg-muted border-border rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Category Pills (real categories from the menu) */}
          <div className="flex overflow-x-auto hide-scrollbar px-4 pb-3 gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </>
      )}
    </header>
  );
}
