'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import { MenuItem } from '@/types';

// Mock modifiers based on food type or category
const getCommonModifiers = (category: string) => {
  if (category === 'Mains') return ['No onions', 'Extra spicy', 'Sauce on side'];
  if (category === 'Drinks') return ['Less ice', 'No ice', 'Extra sugar'];
  return ['Extra sauce', 'To go'];
};

export default function ItemModifierModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const { addItem } = useWaiterOrderStore();

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<MenuItem>;
      setActiveItem(customEvent.detail);
      setNotes('');
      setQuantity(1);
      setIsOpen(true);
    };

    window.addEventListener('open-item-modifier', handleOpen);
    return () => window.removeEventListener('open-item-modifier', handleOpen);
  }, []);

  const handleAdd = () => {
    if (activeItem) {
      addItem(activeItem, quantity, notes.trim());
      setIsOpen(false);
    }
  };

  const toggleModifier = (mod: string) => {
    if (notes.includes(mod)) {
      setNotes(notes.replace(mod, '').replace(/,\s*$/, '').replace(/^,\s*/, '').replace(/,\s*,/, ',').trim());
    } else {
      setNotes(notes ? `${notes}, ${mod}` : mod);
    }
  };

  if (!activeItem) return null;

  const commonModifiers = getCommonModifiers(activeItem.categoryId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[340px] rounded-2xl p-0 overflow-hidden mt-safe">
        <DialogHeader className="p-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold leading-tight">
            {activeItem.name}
          </DialogTitle>
          <p className="text-primary font-bold">${activeItem.price.toFixed(2)}</p>
        </DialogHeader>

        <div className="p-5 space-y-6">
          {/* Quantity selector */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">Quantity</span>
            <div className="flex items-center gap-3 bg-gray-100 rounded-full border border-gray-200 p-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-gray-700"
              >
                -
              </button>
              <span className="w-6 text-center font-bold">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-gray-700"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Modifiers */}
          <div className="space-y-3">
            <span className="font-semibold text-gray-700 block">Quick Modifiers</span>
            <div className="flex flex-wrap gap-2">
              {commonModifiers.map(mod => {
                const isActive = notes.includes(mod);
                return (
                  <button
                    key={mod}
                    onClick={() => toggleModifier(mod)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      isActive 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Notes */}
          <div className="space-y-3">
            <span className="font-semibold text-gray-700 block">Custom Notes</span>
            <Textarea 
              placeholder="e.g. Allergy to peanuts..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-24 rounded-xl focus-visible:ring-primary"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50">
          <Button 
            className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-white" 
            onClick={handleAdd}
          >
            Add to Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
