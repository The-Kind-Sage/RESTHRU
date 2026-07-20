"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveOrders } from "@/lib/actions/orders";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING: "bg-accent text-accent-foreground",
  PREPARING: "bg-info text-info-foreground",
  READY: "bg-success text-success-foreground",
  SERVED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive text-destructive-foreground",
};

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    const res = await getActiveOrders();
    if (res.error) {
      setError(res.error);
    } else {
      setOrders(res.data || []);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/owner">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">All Orders</h1>
          <p className="text-muted-foreground mt-1">View all active orders</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadOrders}>
                Retry
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No active orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{order.orderId}</p>
                      <Badge className={statusColors[order.status] || ""}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(
                          order.items?.reduce(
                            (sum: number, item: any) => sum + (item.pricePerUnit || 0) * (item.quantity || 0),
                            0
                          ) || 0
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.orderType}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {order.table ? `Table ${order.table.tableNumber}` : "No table"}
                        {" · "}
                        {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3">
                      {order.items?.slice(0, 5).map((item: any) => (
                        <div key={item.id} className="relative group">
                          {item.menuItem?.imageUrl ? (
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-card border border-border">
                              <img
                                src={item.menuItem.imageUrl}
                                alt={item.menuItemName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                              {item.menuItemName?.charAt(0)}
                            </div>
                          )}
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[9px] text-primary-foreground font-bold flex items-center justify-center shadow-sm">
                            {item.quantity}
                          </div>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 5 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          +{order.items.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
