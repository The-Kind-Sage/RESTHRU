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
import { createOrder, settleOrder } from '@/lib/actions/orders';
import BillReceiptDialog from '@/components/receipt/BillReceiptDialog';
import { showAlertToast } from '@/components/shared/alert-toast';
import { formatCurrency } from '@/lib/format';

export default function ActiveOrderSheet() {
  const { 
    draftItems, getTotalItems, getTotalPrice, 
    removeItem, orderState, setOrderState, clearDraft, tableNumber, guestCount, orderType, quickBill
  } = useWaiterOrderStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'ESEWA' | 'KHALTI' | 'FONEPAY'>('CASH');
  const [billReceipt, setBillReceipt] = useState<{ open: boolean; items: any[]; bill: any; orderId?: string } | null>(null);
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
      guestCount,
      orderType
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

    const order = (result as any).data;

    // Quick billing is a counter sale: the guest pays as they order, so bill it
    // straight away and show the receipt instead of routing it to the kitchen.
    if (quickBill && order?.id) {
      // Snapshot the lines before clearDraft() wipes them for the receipt.
      const receiptItems = draftItems.map((item) => {
        const unit = item.menuItem.discountPrice ?? item.menuItem.price;
        return {
          name: item.menuItem.name,
          qty: item.quantity,
          price: unit,
          total: unit * item.quantity,
        };
      });

      const settled = await settleOrder({
        orderId: order.id,
        paymentMethod: payMethod,
        quickBill: true,
      });

      if ('error' in settled && settled.error) {
        // The order exists but isn't billed — say so rather than implying it's paid.
        toast.error(`Order ${order.orderId} created, but billing failed: ${settled.error}`);
        setOrderState('CONFIRMED');
        setIsOpen(false);
        clearDraft();
        return;
      }

      setOrderState('CONFIRMED');
      setIsOpen(false);
      clearDraft();
      setBillReceipt({
        open: true,
        items: receiptItems,
        bill: (settled as any).data,
        orderId: order.orderId,
      });
      toast.success('Bill generated', {
        icon: <CheckCircle2 className="text-green-500" />
      });
      return;
    }

    setOrderState('CONFIRMED');
    setIsOpen(false);
    // Same alert card the live notifications use, so every "something happened"
    // popup in the app looks and behaves the same.
    showAlertToast({
      title: 'Order Sent to Kitchen',
      message: `Order #${order?.orderId ?? ''}${tableNumber ? ` (Table ${tableNumber})` : ''} - ${totalItems} item${totalItems !== 1 ? 's' : ''}`,
      actionUrl: window.location.pathname.startsWith('/reception')
        ? '/reception/orders'
        : window.location.pathname.startsWith('/owner')
        ? '/owner/orders'
        : '/order',
      actionLabel: 'View Order',
      icon: <CheckCircle2 className="h-5 w-5" />,
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

  // Stay mounted while a quick-bill receipt is on screen: clearDraft() empties
  // the cart and resets orderState, which would otherwise unmount this
  // component and take the receipt with it before it could be read or printed.
  if (totalItems === 0 && orderState === 'DRAFT' && !billReceipt?.open) {
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
              {/* A quick bill is recorded as paid on the spot, so the method has
                  to be chosen deliberately rather than assumed. */}
              {quickBill && (
                <div className="px-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Payment method</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(['CASH', 'ESEWA', 'KHALTI', 'FONEPAY'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPayMethod(m)}
                        className={
                          'rounded-lg border py-2 text-xs font-semibold transition-colors ' +
                          (payMethod === m
                            ? 'border-primary bg-primary text-white'
                            : 'border-border text-muted-foreground hover:bg-muted')
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Button 
                onClick={handleConfirmOrder} 
                disabled={isSubmitting || draftItems.length === 0}
                className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {isSubmitting
                  ? (quickBill ? 'Billing...' : 'Sending...')
                  : (quickBill ? 'Generate Bill' : 'Confirm')}
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

      {/* Receipt for a quick bill, shown as soon as the sale is recorded */}
      {billReceipt && (
        <BillReceiptDialog
          open={billReceipt.open}
          onOpenChange={(o) =>
            setBillReceipt((prev) => (prev ? { ...prev, open: o } : prev))
          }
          items={billReceipt.items}
          bill={billReceipt.bill}
          orderId={billReceipt.orderId}
          orderType={orderType}
        />
      )}
    </Drawer>
  );
}
