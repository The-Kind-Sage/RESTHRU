'use client';

import React, { useState } from 'react';
import { ShoppingBag, ChevronUp, X, CheckCircle2, Loader2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { createOrder } from '@/lib/actions/orders';
import { formatCurrency } from '@/lib/format';

export default function ActiveOrderSheet() {
  const { 
    draftItems, getTotalItems, getTotalPrice, 
    removeItem, orderState, setOrderState, clearDraft, tableNumber, guestCount
  } = useWaiterOrderStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleConfirmOrder = async () => {
    if (totalItems === 0) return;
    
    setIsSubmitting(true);
    
    // Prepare payload
    const payload = {
      draftItems: draftItems.map(item => ({
        menuItem: { id: item.menuItem.id, name: item.menuItem.name, price: item.menuItem.price },
        quantity: item.quantity,
        notes: item.notes
      })),
      tableNumber,
      guestCount
    };

    const result = await createOrder(payload);

    setIsSubmitting(false);

    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    if ('warning' in result && result.warning) {
      toast.warning(result.warning);
    }

    setOrderState('CONFIRMED');
    setIsOpen(false);
    toast.success('Order Sent to Kitchen', {
      icon: <CheckCircle2 className="text-green-500" />
    });
    clearDraft(); // clear after confirmed
  };

  const [showCancelAlert, setShowCancelAlert] = useState(false);

  const handleCancelOrder = () => {
    clearDraft();
    setIsOpen(false);
    setShowCancelAlert(false);
    toast('Order Cancelled');
  };

  if (totalItems === 0 && orderState === 'DRAFT') {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto bg-card border-t border-border shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe rounded-t-2xl lg:max-w-3xl xl:max-w-5xl">
        <DrawerTrigger asChild>
          <button className="w-full px-6 py-4 flex items-center justify-between active:bg-muted transition-colors rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="text-foreground" size={24} />
                <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground leading-none mb-1">
                  {orderState === 'DRAFT' ? 'Current Order' : 'Order Sent'}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {totalItems} items
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-bold text-lg text-primary">
                {formatCurrency(totalPrice)}
              </span>
              <ChevronUp className="text-muted-foreground" size={20} />
            </div>
          </button>
        </DrawerTrigger>
      </div>

      <DrawerContent className="mx-auto max-h-[85vh] lg:max-w-3xl xl:max-w-5xl">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="text-center">Order Details</DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-4">
            {draftItems.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="font-bold text-foreground min-w-[24px]">
                    {item.quantity}x
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{item.menuItem.name}</h4>
                    {item.notes && (
                      <p className="text-sm text-warning font-medium mt-0.5">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground">
                    {formatCurrency((item.menuItem.discountPrice ?? item.menuItem.price) * item.quantity)}
                  </span>
                  {orderState === 'DRAFT' && (
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {draftItems.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No items in the order.
              </div>
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t border-border pt-4 pb-safe gap-3">
          <div className="px-2 space-y-1 mb-2">
            <div className="flex justify-between items-center pt-1 border-t border-border mt-1">
              <span className="font-semibold text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">{formatCurrency(totalPrice)}</span>
            </div>
          </div>
          
          {orderState === 'DRAFT' ? (
            <>
              <Button 
                onClick={handleConfirmOrder} 
                disabled={isSubmitting || draftItems.length === 0}
                className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {isSubmitting ? 'Sending...' : 'Confirm'}
              </Button>
              <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl border-border text-muted-foreground"
                  >
                    Cancel Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All items in the current order will be removed. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90">
                      Yes, Cancel Order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                Start New Order
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
