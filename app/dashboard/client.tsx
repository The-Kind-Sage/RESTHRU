"use client";

import dynamic from "next/dynamic";
import { useState, useTransition, useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { getGreeting } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ShoppingBag, LayoutGrid, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type {
  DashboardStats,
  RecentOrder,
  ChartPoint,
  TopItem,
  Activity,
} from "@/lib/actions/dashboard";
import { getRevenueChartData, getDashboardStats, getRecentOrders, getRecentActivity } from "@/lib/actions/dashboard";
import { ChartSkeleton } from "@/components/dashboard/skeletons";

// ── Lazy-load heavy libraries ─────────────────────────────────────────────
// recharts (~200 kB) and framer-motion (~100 kB) are only needed after
// hydration. dynamic() splits them into separate chunks loaded on demand.
const RevenueChart = dynamic(
  () => import("@/components/dashboard/revenue-chart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

// Framer Motion wrapper — only used for entry animations, loaded lazily.
const MotionDiv = dynamic(
  () => import("framer-motion").then((m) => ({ default: m.motion.div })),
  { ssr: false, loading: () => <div /> }
);

// ── Types ─────────────────────────────────────────────────────────────────
type DashboardData = {
  stats: DashboardStats | null;
  orders: RecentOrder[];
  chartData: ChartPoint[];
  topItems: TopItem[];
  activities: Activity[];
};

// ── Component ─────────────────────────────────────────────────────────────
export default function DashboardClient({
  stats,
  orders,
  chartData: initialChartData,
  topItems,
  activities,
}: DashboardData) {
  const { user, restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [chartData, setChartData] = useState<ChartPoint[]>(initialChartData);
  const [isPending, startTransition] = useTransition();
  const [liveStats, setLiveStats] = useState(stats);
  const [liveOrders, setLiveOrders] = useState(orders);
  const [liveActivities, setLiveActivities] = useState(activities);

  // Period toggle now re-fetches chart data from the server action.
  // useTransition keeps the UI interactive while the fetch is in-flight.
  const handlePeriodChange = useCallback(
    (p: "week" | "month") => {
      if (p === period) return;
      setPeriod(p);
      startTransition(async () => {
        if (!restaurantId) return;
        const fresh = await getRevenueChartData(restaurantId, p).catch(() => null);
        if (fresh) setChartData(fresh);
      });
    },
    [period, restaurantId]
  );

  useEffect(() => {
    if (!restaurantId) return;
    const poll = async () => {
      const [freshStats, freshOrders, freshActivities] = await Promise.all([
        getDashboardStats(restaurantId).catch(() => null),
        getRecentOrders(restaurantId, 10).catch(() => []),
        getRecentActivity(restaurantId).catch(() => []),
      ]);
      if (freshStats) setLiveStats(freshStats);
      if (freshOrders) setLiveOrders(freshOrders);
      if (freshActivities) setLiveActivities(freshActivities);
    };
    poll();
    const interval = setInterval(poll, 15_000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const statusColors: Record<string, string> = {
    PENDING: "bg-accent",
    PREPARING: "bg-info",
    READY: "bg-success",
    SERVED: "bg-muted",
    CANCELLED: "bg-destructive",
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ── Greeting banner ── */}
      <Card className="bg-gradient-to-r from-primary-light to-primary-light border-primary/20">
        <CardContent className="p-8 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {getGreeting()}, {user?.firstName || "Owner"}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {liveStats?.todayOrders
                ? `Served ${liveStats.todayOrders} customers today.`
                : "Ready to serve!"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Revenue Today</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(liveStats?.todayRevenue ?? 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(
          [
            {
              icon: TrendingUp,
              title: "Today's Revenue",
              value: formatCurrency(liveStats?.todayRevenue ?? 0),
              change: liveStats?.todayOrders ? `${liveStats.todayOrders} orders today` : "No orders yet",
              color: "text-success",
            },
            {
              icon: ShoppingBag,
              title: "Total Orders",
              value: liveStats?.totalOrders ?? 0,
              change: liveStats?.todayOrders ? `${liveStats.todayOrders} today` : "No orders yet",
              color: "text-primary",
            },
            {
              icon: LayoutGrid,
              title: "Active Tables",
              value: liveStats ? `${liveStats.occupiedTables}/${liveStats.totalTables}` : "0/0",
              change: liveStats ? `${liveStats.occupiedTables} occupied` : "No tables",
              color: "text-accent",
            },
            {
              icon: Clock,
              title: "Pending Orders",
              value: liveStats?.pendingOrders ?? 0,
              change: "In kitchen",
              color: "text-destructive",
              pulse: true,
            },
          ] as const
        ).map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {kpi.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    "pulse" in kpi && kpi.pulse
                      ? "bg-destructive/10 animate-pulse"
                      : "bg-muted"
                  }`}
                >
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {kpi.change}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue chart — lazy loaded */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Revenue</CardTitle>
                <div className="flex gap-2">
                  {(["week", "month"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePeriodChange(p)}
                      disabled={isPending}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        period === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      } disabled:opacity-50`}
                    >
                      {p === "week" ? "This Week" : "This Month"}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  Loading chart…
                </div>
              ) : (
                <RevenueChart data={chartData} />
              )}
            </CardContent>
          </Card>

          {/* Top items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Items</CardTitle>
            </CardHeader>
            <CardContent>
              {topItems.length > 0 ? (
                <div className="space-y-4">
                  {topItems.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              item.isVeg ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className="text-sm font-medium flex-1">
                            {item.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.orders} orders
                          </span>
                        </div>
                        <span className="text-sm font-semibold ml-2">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  No items sold yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table overview */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Table Overview</CardTitle>
                <Link
                  href="/dashboard/tables"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View Full Map <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {liveStats && liveStats.totalTables > 0 ? (
                <>
                  <div className="grid grid-cols-5 gap-2 mb-6">
                    {Array.from({ length: liveStats.totalTables }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`aspect-square rounded-lg ${
                          idx < liveStats.occupiedTables
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground border-t pt-4">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-sm" />
                      {liveStats.occupiedTables} Occupied
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-sm" />
                      {liveStats.availableTables} Available
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  No tables configured
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Live orders + activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Live Orders</CardTitle>
              <Link
                href="/dashboard/orders"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {liveOrders.length > 0 ? (
              <div className="space-y-3">
                {liveOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {order.orderId}
                        {order.table && ` • Table ${order.table.tableNumber}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-semibold">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <Badge
                        variant="outline"
                        className={statusColors[order.status]}
                      >
                        {order.status?.charAt(0) +
                          order.status?.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No orders yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {liveActivities.length > 0 ? (
              <div className="space-y-4">
                {liveActivities.map((a) => (
                  <div key={a.id} className="flex gap-4 items-start">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${
                        a.type === "order"
                          ? "bg-green-500"
                          : a.type === "payment"
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(a.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
