'use client';

import React from 'react';
import { Search, X, Users, WifiOff, ClipboardList, UtensilsCrossed } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import { useOrderSync } from '@/hooks/useOrderSync';
import { useReadyNotifications } from '@/hooks/useReadyNotifications';
import type { PosView } from './OrderPageClient';

export interface PosCategory {
  id: string;
  name: string;
}

export default function OrderHeader({
  categories,
  view,
  onViewChange,
}: {
  categories: PosCategory[];
  view: PosView;
  onViewChange: (view: PosView) => void;
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

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm pt-safe-top">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-500 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2">
          <WifiOff size={14} />
          <span>Offline - Saving locally</span>
        </div>
      )}

      {/* Top Bar: Table Info, View Toggle & Live Status */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1.5 rounded-full"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-table-selector'));
          }}
        >
          <span className="font-bold text-gray-900">
            Table {tableNumber || '??'}
          </span>
          <div className="flex items-center gap-1 text-gray-500 text-sm border-l border-gray-300 pl-2">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search items or codes (e.g. 05)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 text-base bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
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
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
