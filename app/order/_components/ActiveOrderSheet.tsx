'use client';

import React, { useState } from 'react';
import { ShoppingBag, ChevronUp, X, CheckCircle2 } from 'lucide-react';
import { useWaiterOrderStore } from '@/store/waiter-order-store';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function ActiveOrderSheet() {
  const { 
    draftItems, getTotalItems, getTotalPrice, 
    removeItem, orderState, setOrderState, clearDraft 
  } = useWaiterOrderStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleConfirmOrder = () => {
    if (totalItems === 0) return;
    
    // Optimistic Update
    setOrderState('CONFIRMED');
    setIsOpen(false);
    toast.success('Order Sent to Kitchen', {
      icon: <CheckCircle2 className="text-green-500" />
    });
  };

  const handleCancelOrder = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      clearDraft();
      setIsOpen(false);
      toast('Order Cancelled');
    }
  };

  if (totalItems === 0 && orderState === 'DRAFT') {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white border-t border-gray-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe rounded-t-2xl">
        <DrawerTrigger asChild>
          <button className="w-full px-6 py-4 flex items-center justify-between active:bg-gray-50 transition-colors rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="text-gray-900" size={24} />
                <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 leading-none mb-1">
                  {orderState === 'DRAFT' ? 'Current Order' : 'Order Sent'}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {totalItems} items
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-bold text-lg text-primary">
                ${totalPrice.toFixed(2)}
              </span>
              <ChevronUp className="text-gray-400" size={20} />
            </div>
          </button>
        </DrawerTrigger>
      </div>

      <DrawerContent className="max-w-md mx-auto max-h-[85vh]">
        <DrawerHeader className="border-b border-gray-100 pb-4">
          <DrawerTitle className="text-center">Order Details</DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-4">
            {draftItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="font-bold text-gray-900 min-w-[24px]">
                    {item.quantity}x
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                    {item.notes && (
                      <p className="text-sm text-amber-600 font-medium mt-0.5">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    ${(item.menuItem.price * item.quantity).toFixed(2)}
                  </span>
                  {orderState === 'DRAFT' && (
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {draftItems.length === 0 && (
              <div className="text-center text-gray-500 py-10">
                No items in the order.
              </div>
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t border-gray-100 pt-4 pb-safe gap-3">
          <div className="flex justify-between items-center px-2 mb-2">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="text-2xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
          </div>
          
          {orderState === 'DRAFT' ? (
            <>
              <Button 
                onClick={handleConfirmOrder} 
                className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                Confirm & Send to Kitchen
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancelOrder}
                className="w-full h-12 rounded-xl border-gray-200 text-gray-600"
              >
                Cancel Order
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => {
                  setOrderState('DRAFT');
                  setIsOpen(false);
                }} 
                className="w-full h-14 text-lg font-bold rounded-xl"
              >
                Modify Active Order
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
