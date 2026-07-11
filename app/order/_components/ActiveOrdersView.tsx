'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2, RefreshCw, ChefHat, BellRing, CheckCircle2,
  Banknote, Smartphone, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { getActiveOrders, updateOrderStatus, settleOrder } from '@/lib/actions/orders';
import { Order } from '@/types';
import { cn } from '@/lib/utils';

const POLL_INTERVAL_MS = 10_000;

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: Banknote },
  { id: 'ESEWA', label: 'eSewa', icon: Smartphone },
  { id: 'KHALTI', label: 'Khalti', icon: Smartphone },
  { id: 'FONEPAY', label: 'FonePay', icon: Smartphone },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

const STATUS_STYLES: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20', icon: ChefHat },
  PREPARING: { label: 'Cooking', className: 'bg-primary/10 text-primary border-primary/20', icon: ChefHat },
  READY: { label: 'Ready to Serve', className: 'bg-success/10 text-success border-success/20', icon: BellRing },
  SERVED: { label: 'Served — Unpaid', className: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
};

export default function ActiveOrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  // Payment dialog state
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<PaymentMethodId>('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  const fetchOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    const result = await getActiveOrders();
    if (result.error) {
      setError(result.error);
    } else {
      setError(null);
      setOrders((result.data ?? []) as unknown as Order[]);
    }
    if (isInitial) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (order: Order, status: string, successMsg: string) => {
    setBusyOrderId(order.id);
    const result = await updateOrderStatus(order.id, status);
    setBusyOrderId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(successMsg);
    fetchOrders(false);
  };

  const openPayment = (order: Order) => {
    setPayingOrder(order);
    setMethod('CASH');
    // Round up so the pre-filled cash amount always covers the total
    setAmountReceived(Math.ceil(order.totalAmount).toString());
  };

  const handleSettle = async () => {
    if (!payingOrder) return;
    setIsSettling(true);
    const result = await settleOrder({
      orderId: payingOrder.id,
      paymentMethod: method,
      // Digital payments are always exact; only cash needs the received amount
      amountPaid: method === 'CASH' ? (parseFloat(amountReceived) || payingOrder.totalAmount) : undefined,
    });
    setIsSettling(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const bill = result.data as any;
    toast.success(
      `Payment received — Bill ${bill.billNumber}` +
      (bill.change > 0 ? ` · Change: ${formatCurrency(bill.change)}` : '')
    );
    setPayingOrder(null);
    fetchOrders(false);
  };

  const change = payingOrder
    ? Math.max(0, (parseFloat(amountReceived) || 0) - payingOrder.totalAmount)
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-medium">Loading orders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
        <p className="text-destructive font-semibold">Failed to load orders</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => fetchOrders(true)} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {orders.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
          <p className="text-4xl mb-3">🧾</p>
          <p className="font-medium">No active orders</p>
          <p className="text-sm text-muted-foreground mt-1">New orders appear here automatically.</p>
        </div>
      )}

      {orders.map((order) => {
        const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
        const StatusIcon = style.icon;
        const isBusy = busyOrderId === order.id;
        const canCancel = order.status === 'PENDING' || order.status === 'PREPARING';
        const canServe = order.status === 'READY';
        const canPay = order.status === 'READY' || order.status === 'SERVED';

        return (
          <div
            key={order.id}
            className={cn(
              'bg-card rounded-2xl border shadow-sm overflow-hidden',
              order.status === 'READY' ? 'border-success/50 ring-1 ring-success/20' : 'border-border'
            )}
          >
            {/* Card header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
              <div>
                <p className="font-bold text-foreground">
                  #{order.orderId}
                  <span className="text-muted-foreground font-medium text-sm ml-2">
                    {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : order.orderType}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</p>
              </div>
              <Badge variant="outline" className={cn('gap-1 font-semibold', style.className)}>
                <StatusIcon size={12} />
                {style.label}
              </Badge>
            </div>

            {/* Items */}
            <div className="px-4 py-3 space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    <span className="font-semibold">{item.quantity}x</span> {item.menuItemName}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(item.pricePerUnit * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-1 border-t border-border text-sm">
                <span className="font-semibold text-muted-foreground">Total (incl. tax)</span>
                <span className="font-bold text-foreground">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            {/* Actions */}
            {(canCancel || canServe || canPay) && (
              <div className="px-4 pb-4 pt-1 flex gap-2">
                {canServe && (
                  <Button
                    disabled={isBusy}
                    onClick={() => handleStatusChange(order, 'SERVED', `Order #${order.orderId} served`)}
                    className="flex-1 h-11 font-bold rounded-xl bg-success hover:bg-success/90 text-white"
                  >
                    {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark Served'}
                  </Button>
                )}
                {canPay && (
                  <Button
                    disabled={isBusy}
                    onClick={() => openPayment(order)}
                    variant={canServe ? 'outline' : 'default'}
                    className="flex-1 h-11 font-bold rounded-xl"
                  >
                    Collect Payment
                  </Button>
                )}
                {canCancel && (
                  <Button
                    disabled={isBusy}
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Cancel order #${order.orderId}? The kitchen will stop preparing it.`)) {
                        handleStatusChange(order, 'CANCELLED', `Order #${order.orderId} cancelled`);
                      }
                    }}
                    className="h-11 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <XCircle size={16} />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Payment dialog */}
      <Dialog open={!!payingOrder} onOpenChange={(open) => !open && setPayingOrder(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              Collect Payment — #{payingOrder?.orderId}
            </DialogTitle>
          </DialogHeader>

          {payingOrder && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(payingOrder.totalAmount)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold text-sm transition-colors',
                        method === m.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                      )}
                    >
                      <m.icon size={16} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {method === 'CASH' && (
                <div className="space-y-2">
                  <Label htmlFor="received" className="text-foreground font-semibold">
                    Amount Received
                  </Label>
                  <Input
                    id="received"
                    type="number"
                    inputMode="numeric"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="h-12 text-xl text-center font-bold rounded-xl"
                  />
                  {change > 0 && (
                    <p className="text-center text-sm font-semibold text-success">
                      Change to return: {formatCurrency(change)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={handleSettle}
              disabled={isSettling}
              className="w-full h-12 text-lg font-bold rounded-xl"
            >
              {isSettling ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
