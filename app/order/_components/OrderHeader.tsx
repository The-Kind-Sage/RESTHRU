'use client';

import React from 'react';
import { Search, X, Users, WifiOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import { useOrderSync } from '@/hooks/useOrderSync';
import { useReadyNotifications } from '@/hooks/useReadyNotifications';

const CATEGORIES = ['All', 'Appetizers', 'Mains', 'Drinks', 'Desserts'];

export default function OrderHeader() {
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

      {/* Top Bar: Table Info & Live Status */}
      <div className="flex items-center justify-between px-4 py-3">
        <button 
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1.5 rounded-full"
          onClick={() => {
            // Trigger TableSelectorModal (we can use a separate ui-store or simple state for this, 
            // but for now we'll just fire a custom event or let the modal listen to a specific state)
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

        {orderState !== 'DRAFT' && (
          <Badge variant={orderState === 'LIVE_TRACKING' ? 'default' : 'secondary'} className="animate-pulse">
            {orderState === 'LIVE_TRACKING' ? 'Kitchen Prepping' : 'Order Sent'}
          </Badge>
        )}
      </div>

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

      {/* Category Pills (Horizontal Scroll) */}
      <div className="flex overflow-x-auto hide-scrollbar px-4 pb-3 gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (selectedCategory === cat || (cat === 'All' && !selectedCategory))
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </header>
  );
}
