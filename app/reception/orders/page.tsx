"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Loader2, ArrowRight, XCircle, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { getOrdersWithItems } from "@/lib/actions/dashboard";
import { updateOrderStatus, settleOrder, voidOrderItem, voidOrder } from "@/lib/actions/orders";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Ban } from "lucide-react";
import ManagerApprovalDialog from "@/components/dashboard/manager-approval-dialog";

type OrderStatus = "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

const statusConfig: Record<OrderStatus, { label: string; bgColor: string; nextStatus: OrderStatus | null; nextLabel?: string }> = {
  PENDING: { label: "Pending", bgColor: "bg-accent", nextStatus: "PREPARING", nextLabel: "Start Cooking" },
  PREPARING: { label: "Preparing", bgColor: "bg-info", nextStatus: "READY", nextLabel: "Mark Ready" },
  READY: { label: "Ready", bgColor: "bg-success", nextStatus: "SERVED", nextLabel: "Mark Served" },
  SERVED: { label: "Served", bgColor: "bg-muted", nextStatus: null },
  CANCELLED: { label: "Cancelled", bgColor: "bg-destructive", nextStatus: null },
};

const PAYMENT_METHODS = ["CASH", "ESEWA", "KHALTI", "FONEPAY"] as const;

export default function LiveOrdersPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | "all">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<(typeof PAYMENT_METHODS)[number]>("CASH");
  const [isSettling, setIsSettling] = useState(false);
  const [voidItemTarget, setVoidItemTarget] = useState<any>(null);
  const [voidOrderTarget, setVoidOrderTarget] = useState<any>(null);

  const refresh = useCallback(() => {
    if (!restaurantId) return;
    getOrdersWithItems(restaurantId, 50).then(setOrders).catch(() => {});
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    getOrdersWithItems(restaurantId, 50).then(setOrders).catch(() => setOrders([]));
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [restaurantId, refresh]);

  const activeCount = useMemo(
    () => orders.filter((o: any) => !["SERVED", "CANCELLED"].includes(o.status)).length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (selectedFilter === "all") return orders;
    return orders.filter((o: any) => o.status === selectedFilter);
  }, [orders, selectedFilter]);

  const ordersByStatus = useMemo(() => ({
    PENDING: filteredOrders.filter((o: any) => o.status === "PENDING"),
    PREPARING: filteredOrders.filter((o: any) => o.status === "PREPARING"),
    READY: filteredOrders.filter((o: any) => o.status === "READY"),
    SERVED: filteredOrders.filter((o: any) => o.status === "SERVED"),
    CANCELLED: filteredOrders.filter((o: any) => o.status === "CANCELLED"),
  }), [filteredOrders]);

  const tabs: { key: OrderStatus | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "PREPARING", label: "Preparing" },
    { key: "READY", label: "Ready" },
    { key: "SERVED", label: "Served" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  const handleAdvance = async (order: any, status: OrderStatus) => {
    setBusyOrderId(order.id);
    const result = await updateOrderStatus(order.id, status);
    setBusyOrderId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Order ${order.orderId} → ${statusConfig[status].label}`);
    // Update the dialog copy too if it's open on this order
    setSelectedOrder((prev: any) => (prev?.id === order.id ? { ...prev, status } : prev));
    refresh();
  };

  const handleCancel = async (order: any) => {
    if (!confirm(`Cancel order ${order.orderId}? The kitchen will stop preparing it.`)) return;
    await handleAdvance(order, "CANCELLED");
    setIsDialogOpen(false);
  };

  const handleSettle = async (order: any) => {
    setIsSettling(true);
    const result = await settleOrder({ orderId: order.id, paymentMethod: payMethod });
    setIsSettling(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const bill = result.data as any;
    toast.success(`Bill ${bill.billNumber} settled — ${formatCurrency(bill.totalAmount)} (${payMethod})`);
    setIsDialogOpen(false);
    refresh();
  };

  const hasBill = (order: any) => (order?.bills?.length ?? 0) > 0;

  const handleVoidItem = async (data: { reason: string; approverUsername: string; approverPassword: string }) => {
    const result = await voidOrderItem({ orderItemId: voidItemTarget.id, ...data });
    if (result.error) return { error: result.error };
    toast.success(`${voidItemTarget.menuItemName} voided`);
    setSelectedOrder(result.data);
    setVoidItemTarget(null);
    refresh();
  };

  const handleVoidOrder = async (data: { reason: string; approverUsername: string; approverPassword: string }) => {
    const result = await voidOrder({ orderId: voidOrderTarget.id, ...data });
    if (result.error) return { error: result.error };
    toast.success(`Order ${voidOrderTarget.orderId} voided`);
    setVoidOrderTarget(null);
    setIsDialogOpen(false);
    refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-full px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Live Orders</h1>
                <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                  {activeCount} Active Orders
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
                  <div className="relative w-2 h-2">
                    <div className="absolute inset-0 bg-success rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-success rounded-full" />
                  </div>
                  <span className="text-xs font-semibold text-primary">Live</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
                  {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={selectedFilter === tab.key ? "default" : "outline"}
                  onClick={() => setSelectedFilter(tab.key as any)}
                  className="whitespace-nowrap"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {(Object.entries(ordersByStatus) as [OrderStatus, any[]][]).map(([status, statusOrders]) => (
            <div key={status} className="flex-shrink-0 w-96 bg-muted/30 rounded-lg border">
              <div className={`${statusConfig[status].bgColor} text-white p-3 rounded-t-lg flex justify-between items-center`}>
                <h2 className="font-semibold text-sm">{statusConfig[status].label}</h2>
                <Badge variant="secondary" className="bg-background text-black">{statusOrders.length}</Badge>
              </div>
              <ScrollArea className="h-[500px] p-3">
                <div className="space-y-3">
                  <AnimatePresence>
                    {statusOrders.map((order: any) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            <div
                              onClick={() => { setSelectedOrder(order); setIsDialogOpen(true); }}
                              className="cursor-pointer space-y-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-sm">{order.orderId}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    {order.table ? `Table ${order.table.tableNumber}` : "Takeaway"}
                                  </p>
                                </div>
                                <Badge variant={order.status === "PENDING" ? "default" : "outline"}>
                                  {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)}m
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                {order.items?.slice(0, 3).map((item: any) => (
                                  <p key={item.id} className="text-xs text-foreground">
                                    {item.quantity}x {item.menuItemName}
                                  </p>
                                ))}
                                {order.items?.length > 3 && (
                                  <p className="text-xs text-muted-foreground">+{order.items.length - 3} more</p>
                                )}
                              </div>
                              <Separator className="my-2" />
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                                <span className="text-muted-foreground">{formatRelativeTime(order.createdAt)}</span>
                              </div>
                            </div>

                            {statusConfig[status].nextStatus && (
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  disabled={busyOrderId === order.id}
                                  onClick={() => handleAdvance(order, statusConfig[status].nextStatus!)}
                                  className="flex-1 gap-1"
                                >
                                  {busyOrderId === order.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <ArrowRight className="w-3 h-3" />}
                                  {statusConfig[status].nextLabel}
                                </Button>
                                {(status === "PENDING" || status === "PREPARING") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busyOrderId === order.id}
                                    onClick={() => handleCancel(order)}
                                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {statusOrders.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">No orders</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOrder?.orderId || "Order Details"}</DialogTitle>
            <DialogDescription>
              {selectedOrder?.table ? `Table ${selectedOrder.table.tableNumber}` : "Takeaway"} - {statusConfig[selectedOrder?.status as OrderStatus]?.label || "Unknown"}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-3">Order Items</h3>
                <div className="space-y-2 bg-muted/50 p-3 rounded">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className={item.status === "CANCELLED" ? "line-through text-muted-foreground" : ""}>
                        {item.quantity}x {item.menuItemName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(item.pricePerUnit * item.quantity)}</span>
                        {item.status !== "CANCELLED" && !hasBill(selectedOrder) && (
                          <button
                            onClick={() => setVoidItemTarget(item)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Void item"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>VAT (13%)</span>
                    <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <span className="text-lg">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
              {selectedOrder.specialRequests && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Special Requests</h3>
                  <p className="text-sm bg-muted p-3 rounded">{selectedOrder.specialRequests}</p>
                </div>
              )}

              {/* Settle payment — available once the food is ready or served and unbilled */}
              {["READY", "SERVED"].includes(selectedOrder.status) && !hasBill(selectedOrder) && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Banknote className="w-4 h-4" /> Collect Payment
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {PAYMENT_METHODS.map((m) => (
                      <Button
                        key={m}
                        size="sm"
                        variant={payMethod === m ? "default" : "outline"}
                        onClick={() => setPayMethod(m)}
                      >
                        {m}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      disabled={isSettling}
                      onClick={() => handleSettle(selectedOrder)}
                      className="ml-auto gap-1"
                    >
                      {isSettling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Settle {formatCurrency(selectedOrder.totalAmount)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedOrder && statusConfig[selectedOrder.status as OrderStatus]?.nextStatus && (
              <Button
                disabled={busyOrderId === selectedOrder.id}
                onClick={() => handleAdvance(selectedOrder, statusConfig[selectedOrder.status as OrderStatus].nextStatus!)}
                className="gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                {statusConfig[selectedOrder.status as OrderStatus].nextLabel}
              </Button>
            )}
            {selectedOrder && ["PENDING", "PREPARING"].includes(selectedOrder.status) && (
              <Button
                variant="outline"
                onClick={() => handleCancel(selectedOrder)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
              >
                <XCircle className="w-4 h-4" /> Cancel Order
              </Button>
            )}
            {selectedOrder && ["READY", "SERVED"].includes(selectedOrder.status) && !hasBill(selectedOrder) && (
              <Button
                variant="outline"
                onClick={() => setVoidOrderTarget(selectedOrder)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
              >
                <Ban className="w-4 h-4" /> Void Order
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManagerApprovalDialog
        open={!!voidItemTarget}
        onOpenChange={(o) => !o && setVoidItemTarget(null)}
        title={`Void ${voidItemTarget?.menuItemName ?? "item"}`}
        description="Voiding an item requires a manager, owner, or admin to authorize with their own login."
        onConfirm={handleVoidItem}
      />
      <ManagerApprovalDialog
        open={!!voidOrderTarget}
        onOpenChange={(o) => !o && setVoidOrderTarget(null)}
        title={`Void order ${voidOrderTarget?.orderId ?? ""}`}
        description="Voiding an order requires a manager, owner, or admin to authorize with their own login."
        onConfirm={handleVoidOrder}
      />
    </div>
  );
}
