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
import { formatCurrency } from '@/lib/format';

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

  const commonModifiers = activeItem.addOns?.filter(a => a.isAvailable) || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="rounded-2xl p-0 overflow-hidden mt-safe sm:max-w-[400px]">
        <DialogHeader className="p-5 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            {activeItem.imageUrl && (
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                <img src={activeItem.imageUrl} alt={activeItem.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <DialogTitle className="text-xl font-bold leading-tight">
                {activeItem.name}
              </DialogTitle>
              <p className="text-primary font-bold">{formatCurrency(activeItem.discountPrice ?? activeItem.price)}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-6">
          {/* Quantity selector */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Quantity</span>
            <div className="flex items-center gap-3 bg-muted rounded-full border border-border p-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center font-bold text-foreground"
              >
                -
              </button>
              <span className="w-6 text-center font-bold">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center font-bold text-foreground"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Modifiers — data-driven from actual add-ons */}
          {commonModifiers.length > 0 && (
            <div className="space-y-3">
              <span className="font-semibold text-foreground block">Quick Modifiers</span>
              <div className="flex flex-wrap gap-2">
                {commonModifiers.map(mod => {
                  const isActive = notes.includes(mod.name);
                  return (
                    <button
                      key={mod.id}
                      onClick={() => toggleModifier(mod.name)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        isActive 
                          ? 'bg-primary/10 border-primary/20 text-primary' 
                          : 'bg-card border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {mod.name}{mod.price > 0 ? ` (+${formatCurrency(mod.price)})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Notes */}
          <div className="space-y-3">
            <span className="font-semibold text-foreground block">Custom Notes</span>
            <Textarea 
              placeholder="e.g. Allergy to peanuts..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-24 rounded-xl focus-visible:ring-primary"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/50">
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
