"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Printer, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { getOrdersWithItems } from "@/lib/actions/dashboard";
import { useAuthStore } from "@/store/auth-store";
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

type OrderStatus = "PENDING" | "PREPARING" | "READY" | "SERVED";

const statusConfig: Record<OrderStatus, { label: string; bgColor: string; nextStatus: OrderStatus | null }> = {
  PENDING: { label: "Pending", bgColor: "bg-accent", nextStatus: "PREPARING" },
  PREPARING: { label: "Preparing", bgColor: "bg-info", nextStatus: "READY" },
  READY: { label: "Ready", bgColor: "bg-success", nextStatus: "SERVED" },
  SERVED: { label: "Served", bgColor: "bg-muted", nextStatus: null },
};

export default function LiveOrdersPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | "all">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    getOrdersWithItems(restaurantId, 50).then(setOrders).catch(() => setOrders([]));
    const interval = setInterval(() => {
      getOrdersWithItems(restaurantId, 50).then(setOrders).catch(() => {});
    }, 15_000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === "all") return orders;
    return orders.filter((o: any) => o.status === selectedFilter);
  }, [orders, selectedFilter]);

  const ordersByStatus = useMemo(() => ({
    PENDING: filteredOrders.filter((o: any) => o.status === "PENDING"),
    PREPARING: filteredOrders.filter((o: any) => o.status === "PREPARING"),
    READY: filteredOrders.filter((o: any) => o.status === "READY"),
    SERVED: filteredOrders.filter((o: any) => o.status === "SERVED"),
  }), [filteredOrders]);

  const tabs: { key: OrderStatus | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "PREPARING", label: "Preparing" },
    { key: "READY", label: "Ready" },
    { key: "SERVED", label: "Served" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-full px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Live Orders</h1>
                <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                  {orders.length} Active Orders
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
                        onClick={() => { setSelectedOrder(order); setIsDialogOpen(true); }}
                        className="cursor-pointer"
                      >
                        <Card className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4 space-y-3">
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
                            </div>
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
                      <span>{item.quantity}x {item.menuItemName}</span>
                      <span className="font-medium">{formatCurrency(item.pricePerUnit * item.quantity)}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
