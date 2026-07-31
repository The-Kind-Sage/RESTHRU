"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ArrowRight, XCircle, Banknote, Ban, Receipt, Printer,
  Search, Plus, ChevronDown, Utensils, Bike, CalendarCheck, ShoppingBag,
  ShoppingCart, FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ManagerApprovalDialog from "@/components/dashboard/manager-approval-dialog";
import BillReceiptDialog from "@/components/receipt/BillReceiptDialog";
import { getBill } from "@/lib/actions/bills";
import KotDialog from "@/components/kot/KotDialog";

type AddOrderKey =
  | "DINE_IN" | "DELIVERY" | "RESERVATION" | "TAKEAWAY" | "PICKUP" | "QUICK_BILL";

const ADD_ORDER_OPTIONS: Array<{ key: AddOrderKey; label: string; Icon: React.ElementType }> = [
  { key: "DINE_IN",    label: "Dine In order",  Icon: Utensils },
  { key: "DELIVERY",   label: "Delivery order", Icon: Bike },
  { key: "RESERVATION",label: "Reservation",    Icon: CalendarCheck },
  { key: "TAKEAWAY",   label: "Take away",      Icon: ShoppingBag },
  { key: "PICKUP",     label: "Pick up",        Icon: ShoppingCart },
  { key: "QUICK_BILL", label: "Quick billing",  Icon: FileText },
];

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Dine In",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
  PICKUP: "Pick up",
};

/** Dine-in orders are identified by their table; the rest by their type. */
function orderPlaceLabel(order: any): string {
  if (order?.table?.tableNumber) return `Table ${order.table.tableNumber}`;
  const t = String(order?.orderType ?? "").toUpperCase();
  return ORDER_TYPE_LABELS[t] ?? "Takeaway";
}

type OrderStatus = "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

const statusConfig: Record<OrderStatus, { label: string; bgColor: string; nextStatus: OrderStatus | null; nextLabel?: string }> = {
  PENDING: { label: "Pending", bgColor: "bg-accent", nextStatus: "PREPARING", nextLabel: "Start Cooking" },
  PREPARING: { label: "Preparing", bgColor: "bg-info", nextStatus: "READY", nextLabel: "Mark Ready" },
  READY: { label: "Ready", bgColor: "bg-success", nextStatus: "SERVED", nextLabel: "Mark Served" },
  SERVED: { label: "Served", bgColor: "bg-muted", nextStatus: null },
  CANCELLED: { label: "Cancelled", bgColor: "bg-destructive", nextStatus: null },
};

const PAYMENT_METHODS = ["CASH", "ESEWA", "KHALTI", "FONEPAY"] as const;

const SELF_VOID_ROLES = ["RECEPTIONIST", "MANAGER", "RESTAURANT_OWNER", "ADMIN", "SUPER_ADMIN"];

export default function LiveOrdersPage() {
  const { restaurant, user } = useAuthStore();
  const restaurantId = restaurant?.id;
  const canSelfVoid = user?.role && SELF_VOID_ROLES.includes(user.role);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<(typeof PAYMENT_METHODS)[number]>("CASH");
  const [isSettling, setIsSettling] = useState(false);
  const [voidItemTarget, setVoidItemTarget] = useState<any>(null);
  const [voidOrderTarget, setVoidOrderTarget] = useState<any>(null);
  const [selfVoidReason, setSelfVoidReason] = useState('');
  const [selfVoidTarget, setSelfVoidTarget] = useState<any>(null); // 'item' | 'order'
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [billReceipt, setBillReceipt] = useState<{ open: boolean; items: any[]; bill: any; orderId?: string; tableName?: string; orderType?: string }>({ open: false, items: [], bill: null });
  // Kitchen docket preview — opened after Start Cooking, or for a reprint.
  const [kotState, setKotState] = useState<{ orderId: string | null; reprint: boolean }>({
    orderId: null,
    reprint: false,
  });
  const refresh = useCallback(() => {
    if (!restaurantId) return;
    getOrdersWithItems(restaurantId, 50).then(setOrders).catch(() => {});
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    setInitialLoading(true);
    getOrdersWithItems(restaurantId, 50).then((data) => { setOrders(data); setInitialLoading(false); }).catch(() => { setOrders([]); setInitialLoading(false); });
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [restaurantId, refresh]);

  const activeCount = useMemo(
    () => orders.filter((o: any) => !["SERVED", "CANCELLED"].includes(o.status)).length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const byStatus =
      selectedFilter === "all"
        ? orders
        : orders.filter((o: any) => o.status === selectedFilter);

    const q = searchQuery.trim().toLowerCase();
    if (!q) return byStatus;
    // Match on order number, table, customer, or any dish on the ticket.
    return byStatus.filter((o: any) =>
      String(o.orderId).toLowerCase().includes(q) ||
      String(o.table?.tableNumber ?? "").toLowerCase().includes(q) ||
      String(o.customerName ?? "").toLowerCase().includes(q) ||
      (o.items || []).some((i: any) => String(i.menuItemName ?? "").toLowerCase().includes(q))
    );
  }, [orders, selectedFilter, searchQuery]);

  /**
   * Routes the "Add New Order" shortcuts. This screen is shared by the owner
   * and reception portals, so the destination is resolved from the current
   * portal rather than hard-coded.
   */
  const handleAddOrder = (key: AddOrderKey) => {
    setAddOrderOpen(false);
    const portal = window.location.pathname.startsWith("/owner") ? "/owner" : "/reception";

    switch (key) {
      case "DINE_IN":
      case "TAKEAWAY":
      case "DELIVERY":
      case "PICKUP":
        // Order entry reads ?type= and records it on the order, so a delivery
        // ticket says Delivery and carries no table.
        router.push(`${portal}/order?type=${key}`);
        break;
      case "QUICK_BILL":
        // Counter sale: same order-entry screen, but the cart bills it on the
        // spot (quick=1) rather than sending it to the kitchen.
        router.push(`${portal}/order?type=TAKEAWAY&quick=1`);
        break;
      case "RESERVATION":
        toast.info("Reservations aren't built yet.");
        break;
    }
  };

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
    // Starting the cook is the moment the kitchen needs its docket, so offer to
    // print it rather than forcing a separate trip through the order dialog.
    if (status === "PREPARING") setKotState({ orderId: order.id, reprint: false });
    refresh();
  };

  const handleCancel = async (order: any) => {
    setCancelTarget(order);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    await handleAdvance(cancelTarget, "CANCELLED");
    setIsDialogOpen(false);
    setCancelTarget(null);
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

  const handleShowBill = async (order: any) => {
    const billId = order.bills?.[0]?.id;
    if (!billId) { toast.error("No bill found for this order"); return; }
    const res = await getBill(billId);
    if ("error" in res) { toast.error(res.error); return; }
    const billData = res.data;
    const items = (billData.order?.items || []).map((i: any) => ({
      name: i.menuItemName,
      qty: i.quantity,
      price: i.pricePerUnit,
      total: i.pricePerUnit * i.quantity,
    }));
    setBillReceipt({
      open: true,
      items,
      bill: billData,
      orderId: order.orderId,
      tableName: order.table ? `T${order.table.tableNumber}` : undefined,
      orderType: order.orderType,
    });
  };

  const handleVoidItem = async (data: { reason: string; approverUsername?: string; approverPassword?: string }) => {
    const result = await voidOrderItem({ orderItemId: voidItemTarget.id, ...data });
    if (result.error) return { error: result.error };
    toast.success(`${voidItemTarget.menuItemName} voided`);
    setSelectedOrder(result.data);
    setVoidItemTarget(null);
    refresh();
  };

  const handleVoidOrder = async (data: { reason: string; approverUsername?: string; approverPassword?: string }) => {
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
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold">Live Orders</h1>
                <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                  {activeCount} Active Orders
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="pl-9 w-full sm:w-56"
                  />
                </div>

                <Popover open={addOrderOpen} onOpenChange={setAddOrderOpen}>
                  <PopoverTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" /> Add New Order
                      <ChevronDown className="w-4 h-4 opacity-80" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[420px] max-w-[92vw] p-5">
                    <h3 className="text-lg font-bold mb-4">Add New Order</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {ADD_ORDER_OPTIONS.map(({ key, label, Icon }) => (
                        <button
                          key={key}
                          onClick={() => handleAddOrder(key)}
                          className="flex items-center gap-3 rounded-lg bg-muted/50 hover:bg-muted px-3 py-4 text-left transition-colors"
                        >
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-background border">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
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

      {initialLoading ? (
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted/30 rounded-lg border p-3 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : (
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {(Object.entries(ordersByStatus) as [OrderStatus, any[]][]).map(([status, statusOrders]) => (
            <div key={status} className="flex-[1_1_0] min-w-[280px] max-w-[360px] bg-muted/30 rounded-lg border">
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
                                    {orderPlaceLabel(order)}
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
                                    onClick={() => setCancelTarget(order)}
                                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                            {!statusConfig[status].nextStatus && ["READY", "SERVED"].includes(status) && !hasBill(order) && (
                              <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => { setPayMethod("CASH"); setSelectedOrder(order); setIsDialogOpen(true); }}>
                                  <Banknote className="w-3 h-3" /> Quick Pay
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setVoidOrderTarget(order); }}>
                                  <Ban className="w-3 h-3" /> Void
                                </Button>
                              </div>
                            )}
                            {!statusConfig[status].nextStatus && ["READY", "SERVED"].includes(status) && hasBill(order) && (
                              <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => handleShowBill(order)}>
                                  <Receipt className="w-3 h-3" /> Show Bill
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setVoidOrderTarget(order); }}>
                                  <Ban className="w-3 h-3" /> Void
                                </Button>
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
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOrder?.orderId || "Order Details"}</DialogTitle>
            <DialogDescription>
              {orderPlaceLabel(selectedOrder)} - {statusConfig[selectedOrder?.status as OrderStatus]?.label || "Unknown"}
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
              {["READY", "SERVED"].includes(selectedOrder.status) && hasBill(selectedOrder) && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Receipt className="w-4 h-4" /> Bill
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleShowBill(selectedOrder)}
                  >
                    <Receipt className="w-3 h-3" /> Show Bill
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {/* Reprint — printers jam and kitchens mislay dockets. */}
            {selectedOrder && !["CANCELLED"].includes(selectedOrder.status) && (
              <Button
                variant="outline"
                className="gap-1"
                onClick={() => setKotState({ orderId: selectedOrder.id, reprint: true })}
              >
                <Printer className="w-4 h-4" /> Print KOT
              </Button>
            )}
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

      <BillReceiptDialog
        open={billReceipt.open}
        onOpenChange={(o) => setBillReceipt((prev) => ({ ...prev, open: o }))}
        items={billReceipt.items}
        bill={billReceipt.bill}
        orderId={billReceipt.orderId}
        tableName={billReceipt.tableName}
        orderType={billReceipt.orderType}
      />

      {/* Kitchen docket — shown after Start Cooking and for reprints */}
      <KotDialog
        open={!!kotState.orderId}
        onOpenChange={(o) => !o && setKotState({ orderId: null, reprint: false })}
        orderId={kotState.orderId}
        reprint={kotState.reprint}
      />

      {canSelfVoid ? (
        <>
          <AlertDialog open={!!voidItemTarget} onOpenChange={(o) => !o && setVoidItemTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Void {voidItemTarget?.menuItemName ?? "item"}?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-2">
                <textarea
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Reason for voiding..."
                  value={selfVoidReason}
                  onChange={(e) => setSelfVoidReason(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setVoidItemTarget(null); setSelfVoidReason(''); }}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={!selfVoidReason.trim()}
                  onClick={async () => {
                    const result = await voidOrderItem({ orderItemId: voidItemTarget.id, reason: selfVoidReason.trim() });
                    if (result.error) { toast.error(result.error); return; }
                    toast.success(`${voidItemTarget.menuItemName} voided`);
                    setSelectedOrder(result.data);
                    setVoidItemTarget(null);
                    setSelfVoidReason('');
                    refresh();
                  }}
                >
                  Void Item
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!voidOrderTarget} onOpenChange={(o) => !o && setVoidOrderTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Void order {voidOrderTarget?.orderId ?? ""}?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-2">
                <textarea
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Reason for voiding..."
                  value={selfVoidReason}
                  onChange={(e) => setSelfVoidReason(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setVoidOrderTarget(null); setSelfVoidReason(''); }}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={!selfVoidReason.trim()}
                  onClick={async () => {
                    const result = await voidOrder({ orderId: voidOrderTarget.id, reason: selfVoidReason.trim() });
                    if (result.error) { toast.error(result.error); return; }
                    toast.success(`Order ${voidOrderTarget.orderId} voided`);
                    setVoidOrderTarget(null);
                    setSelfVoidReason('');
                    setIsDialogOpen(false);
                    refresh();
                  }}
                >
                  Void Order
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
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
        </>
      )}

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order {cancelTarget?.orderId}?</AlertDialogTitle>
            <AlertDialogDescription>The kitchen will stop preparing it. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive hover:bg-destructive/90">Cancel Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
