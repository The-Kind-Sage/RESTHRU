"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { getGreeting } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ShoppingBag, LayoutGrid, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function DashboardClient() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [stats, setStats] = useState<{ todayRevenue: number; totalOrders: number; todayOrders: number; occupiedTables: number; totalTables: number; pendingOrders: number } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!supabase) return;
    const restaurantId = "demo";
    const today = new Date().toISOString().split("T")[0];

    supabase.from("orders").select("*").eq("restaurantId", restaurantId).then(({ data: ordersData }) => {
      if (!ordersData) return;
      setStats({
        totalOrders: ordersData.length,
        todayOrders: ordersData.filter((o: any) => o.createdAt?.startsWith(today)).length,
        todayRevenue: ordersData
          .filter((o: any) => o.createdAt?.startsWith(today) && o.status !== "CANCELLED")
          .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
        occupiedTables: 0,
        totalTables: 0,
        pendingOrders: ordersData.filter((o: any) => ["PENDING", "PREPARING"].includes(o.status)).length,
      });
      setOrders(ordersData.slice(0, 5));

      const revenueMap: Record<string, number> = {};
      ordersData
        .filter((o: any) => o.status !== "CANCELLED")
        .forEach((o: any) => {
          const day = o.createdAt?.split("T")[0];
          if (day) revenueMap[day] = (revenueMap[day] || 0) + (o.totalAmount || 0);
        });
      setChartData(Object.entries(revenueMap).map(([date, revenue]) => ({ date, revenue })).slice(-7));

      const itemMap: Record<string, { orders: number; revenue: number }> = {};
      ordersData.forEach((o: any) => {
        (o.items || []).forEach((item: any) => {
          if (!itemMap[item.menuItemName]) itemMap[item.menuItemName] = { orders: 0, revenue: 0 };
          itemMap[item.menuItemName].orders += item.quantity || 0;
          itemMap[item.menuItemName].revenue += (item.quantity || 0) * (item.pricePerUnit || 0);
        });
      });
      setTopItems(
        Object.entries(itemMap)
          .map(([name, data]) => ({ name, ...data, isVeg: true, percentage: 100 }))
          .slice(0, 5)
      );
    });

    supabase.from("restaurant_tables").select("*").eq("restaurantId", restaurantId).then(({ data: tablesData }) => {
      if (tablesData) {
        setStats((prev) => ({
          ...prev!,
          totalTables: tablesData.length,
          occupiedTables: tablesData.filter((t: any) => t.status !== "AVAILABLE").length,
        }));
      }
    });
  }, []);

  const kpiData = [
    { icon: TrendingUp, title: "Today's Revenue", value: formatCurrency(stats?.todayRevenue || 0), change: stats?.todayOrders ? `${stats.todayOrders} orders today` : "No orders yet", color: "text-success" },
    { icon: ShoppingBag, title: "Total Orders", value: stats?.totalOrders || 0, change: stats?.todayOrders ? `${stats.todayOrders} today` : "No orders yet", color: "text-primary" },
    { icon: LayoutGrid, title: "Active Tables", value: stats ? `${stats.occupiedTables}/${stats.totalTables}` : "0/0", change: stats ? `${stats.occupiedTables} occupied` : "No tables yet", color: "text-accent" },
    { icon: Clock, title: "Pending Orders", value: stats?.pendingOrders || 0, change: "In kitchen", color: "text-destructive", pulse: true },
  ];

  return (
    <div className="space-y-6 pb-8">
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-primary-light to-primary-light border-primary/20">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{getGreeting()}, {user?.firstName || "Owner"}!</h1>
              <p className="text-muted-foreground text-lg">{stats?.todayOrders ? `Served ${stats.todayOrders} customers today.` : "Ready to serve!"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Revenue Today</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(stats?.todayRevenue || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card><CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.title}</p>
                  <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${kpi.pulse ? "bg-destructive/10 animate-pulse" : "bg-muted"}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{kpi.change}</span>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants}>
            <Card><CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Revenue {period === "week" ? "This Week" : "This Month"}</CardTitle>
                <div className="flex gap-2">
                  {(["week", "month"] as const).map((p) => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {p === "week" ? "This Week" : "This Month"}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader><CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0E7A52" stopOpacity={0.3} /><stop offset="95%" stopColor="#0E7A52" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="revenue" stroke="#0E7A52" strokeWidth={2} fillOpacity={1} fill="url(#cr)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No revenue data yet</div>
              )}
            </CardContent></Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card><CardHeader><CardTitle>Top Items</CardTitle></CardHeader><CardContent>
              {topItems.length > 0 ? (
                <div className="space-y-4">
                  {topItems.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-3 h-3 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-sm font-medium flex-1">{item.name}</span>
                          <span className="text-xs text-muted-foreground">{item.orders} orders</span>
                        </div>
                        <span className="text-sm font-semibold ml-2">{formatCurrency(item.revenue)}</span>
                      </div>
                      <Progress value={item.percentage || 0} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-sm py-8 text-center">No items sold yet</p>}
            </CardContent></Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card><CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Table Overview</CardTitle>
                <Link href="/dashboard/tables" className="text-sm text-primary hover:underline flex items-center gap-1">View Full Map <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </CardHeader><CardContent>
              {stats && stats.totalTables > 0 ? (
                <>
                  <div className="grid grid-cols-5 gap-2 mb-6">
                    {Array.from({ length: stats.totalTables }).map((_, idx) => (
                      <div key={idx} className={`aspect-square rounded-lg ${idx < stats.occupiedTables ? "bg-red-500" : "bg-green-500"}`} />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground border-t pt-4">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm" /> {stats.occupiedTables} Occupied</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm" /> {stats.totalTables - stats.occupiedTables} Available</span>
                  </div>
                </>
              ) : <p className="text-muted-foreground text-sm py-8 text-center">No tables configured yet</p>}
            </CardContent></Card>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card><CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Live Orders</CardTitle>
              <Link href="/dashboard/orders" className="text-sm text-primary hover:underline flex items-center gap-1">View All <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </CardHeader><CardContent>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{order.orderId} {order.tableId && `• Table ${order.tableId}`}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                      <Badge variant="outline">{order.status?.charAt(0) + order.status?.slice(1).toLowerCase()}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm py-8 text-center">No orders yet</p>}
          </CardContent></Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card><CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader><CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((a: any) => (
                  <div key={a.id} className="flex gap-4 items-start">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${
                      a.type === "order" ? "bg-green-500" : a.type === "payment" ? "bg-blue-500" : a.type === "cancelled" ? "bg-red-500" : "bg-yellow-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(a.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm py-8 text-center">No recent activity</p>}
          </CardContent></Card>
        </motion.div>
      </div>
    </div>
  );
}
