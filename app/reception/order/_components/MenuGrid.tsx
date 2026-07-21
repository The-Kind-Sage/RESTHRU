'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Minus, Info } from 'lucide-react';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import { MenuItem, SpiceLevel } from '@/types';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function MenuGrid({ menuItems }: { menuItems: MenuItem[] }) {
  const { searchQuery, selectedCategory, draftItems, addItem, updateQuantity, orderState } = useWaiterOrderStore();
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);

  // Filter & sort logic
  const filteredMenu = useMemo(() => {
    let items = menuItems.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.id.includes(searchQuery);
      
      const matchesCategory = selectedCategory && selectedCategory !== "__popular__"
        ? item.categoryId === selectedCategory
        : true;
      
      return matchesSearch && matchesCategory;
    });

    if (selectedCategory === "__popular__") {
      items.sort((a, b) => (b.totalOrders ?? 0) - (a.totalOrders ?? 0));
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
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

        const hasMultipleEntries = draftItemsForThisMenu.length > 1;

        return (
          <div 
            key={item.id} 
            className={cn(
              "bg-card rounded-2xl p-4 shadow-sm border border-border flex justify-between items-center active:scale-[0.98] transition-transform select-none",
              orderState === 'DRAFT' && "cursor-pointer"
            )}
            onTouchStart={() => handleTouchStart(item)}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart(item)}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            {item.imageUrl && (
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 mr-3 bg-muted">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-foreground leading-tight">{item.name}</h3>
                {item.spiceLevel === SpiceLevel.HOT && <span className="text-destructive text-xs">🌶️</span>}
                {orderState === 'DRAFT' && (
                  <span title="Long-press for modifiers &amp; notes">
                    <Info className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{item.description}</p>
              )}
              <div className="font-semibold text-primary flex items-center gap-2">
                {formatCurrency(item.discountPrice ?? item.price)}
                {item.discountPrice != null && item.discountPrice < item.price && (
                  <span className="text-xs text-muted-foreground line-through font-normal">
                    {formatCurrency(item.price)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              {totalQuantity > 0 && !hasMultipleEntries ? (
                <div className="flex items-center bg-muted rounded-full border border-border">
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (firstDraftItemId) updateQuantity(firstDraftItemId, draftItemsForThisMenu[0].quantity - 1); }}
                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary active:bg-muted/80 rounded-l-full transition-colors"
                    disabled={orderState !== 'DRAFT'}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-8 text-center font-bold text-foreground">
                    {totalQuantity}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addItem(item); }}
                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary active:bg-muted/80 rounded-r-full transition-colors"
                    disabled={orderState !== 'DRAFT'}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : totalQuantity > 0 && hasMultipleEntries ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    x{totalQuantity}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addItem(item); }}
                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary rounded-full transition-colors bg-muted"
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
        <div className="text-center text-muted-foreground py-10">
          No items found.
        </div>
      )}
    </div>
  );
}
