"use client";

import { Building2, TrendingUp, UserPlus, ShoppingCart, Wallet, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AdminStats {
  totalRestaurants: number;
  activeToday: number;
  newSignups: number;
  totalOrders: number;
  todayGMV: number;
}

interface AdminOrder {
  id: string;
  orderId: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  restaurant: { name: string };
}

interface SubscriptionData {
  name: string;
  value: number;
  percentage: number;
}

export default function AdminClient({
  stats,
  recentOrders,
  subscriptionData,
}: {
  stats: AdminStats | null;
  recentOrders: AdminOrder[];
  subscriptionData: SubscriptionData[];
}) {
  const kpiCards = [
    { title: "Total Restaurants", value: stats?.totalRestaurants || 0, icon: Building2, subtitle: "Active on platform" },
    { title: "Active Today", value: stats?.activeToday || 0, icon: Activity, subtitle: `${stats?.totalRestaurants ? Math.round((stats.activeToday / stats.totalRestaurants) * 100) : 0}% of total` },
    { title: "New Signups (MTD)", value: stats?.newSignups || 0, icon: UserPlus, subtitle: "This month" },
    { title: "Today's Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, subtitle: "Platform-wide" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time platform overview · Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </CardTitle>
              <card.icon className="h-4.5 w-4.5 text-primary/60" strokeWidth={1.5} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground tracking-tight">{card.value}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatCurrency(stats.todayGMV)}</div>
            <p className="text-xs text-muted-foreground mt-1">Gross Merchandise Value</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{order.orderId}</p>
                      <p className="text-xs text-muted-foreground">{order.restaurant.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionData.length > 0 ? (
              <div className="space-y-4">
                {subscriptionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-semibold">{item.value} restaurants</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">No subscription data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
