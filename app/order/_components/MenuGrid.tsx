'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import { MenuItem, SpiceLevel } from '@/types';

export default function MenuGrid({ menuItems }: { menuItems: MenuItem[] }) {
  const { searchQuery, selectedCategory, draftItems, addItem, updateQuantity, orderState } = useWaiterOrderStore();
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);

  // Filter logic
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.id.includes(searchQuery); // using id as a mock "short code" for now
      
      const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, menuItems]);

  const handleTouchStart = (item: MenuItem) => {
    // If order is locked, don't allow modifiers
    if (orderState !== 'DRAFT') return;

    const timeout = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-item-modifier', { detail: item }));
    }, 500); // 500ms for long press
    setLongPressTimeout(timeout);
  };

  const handleTouchEnd = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {filteredMenu.map((item) => {
        // Find if item is in draft (for simplicity, we sum up quantities of this menu item regardless of notes)
        const draftItemsForThisMenu = draftItems.filter(d => d.menuItem.id === item.id);
        const totalQuantity = draftItemsForThisMenu.reduce((sum, d) => sum + d.quantity, 0);
        
        // For simple inc/dec, we act on the first draft item we find for this menu item, 
        // or just add a new one if none exists.
        const firstDraftItemId = draftItemsForThisMenu.length > 0 ? draftItemsForThisMenu[0].id : null;

        return (
          <div 
            key={item.id} 
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center active:scale-[0.98] transition-transform select-none"
            onTouchStart={() => handleTouchStart(item)}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart(item)}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                {item.spiceLevel === SpiceLevel.HOT && <span className="text-red-500 text-xs">🌶️</span>}
              </div>
              {item.description && (
                <p className="text-sm text-gray-500 line-clamp-1 mb-2">{item.description}</p>
              )}
              <div className="font-semibold text-primary">
                ${item.price.toFixed(2)}
              </div>
            </div>

            <div className="flex-shrink-0">
              {totalQuantity > 0 ? (
                <div className="flex items-center bg-gray-100 rounded-full border border-gray-200">
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (firstDraftItemId) updateQuantity(firstDraftItemId, draftItemsForThisMenu[0].quantity - 1); }}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary active:bg-gray-200 rounded-l-full transition-colors"
                    disabled={orderState !== 'DRAFT'}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900">
                    {totalQuantity}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addItem(item); }}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary active:bg-gray-200 rounded-r-full transition-colors"
                    disabled={orderState !== 'DRAFT'}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); addItem(item); }}
                  disabled={orderState !== 'DRAFT'}
                  className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 active:bg-primary/30 transition-colors disabled:opacity-50"
                >
                  <Plus size={24} />
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      {filteredMenu.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No items found.
        </div>
      )}
    </div>
  );
}
