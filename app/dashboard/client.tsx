"use client";

import dynamic from "next/dynamic";
import { useState, useTransition, useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { getGreeting } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ShoppingBag, LayoutGrid, Clock, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type {
  DashboardStats,
  RecentOrder,
  ChartPoint,
  TopItem,
  Activity,
  TableOverviewItem,
} from "@/lib/actions/dashboard";
import { getRevenueChartData, getDashboardStats, getRecentOrders, getRecentActivity, getTableOverview } from "@/lib/actions/dashboard";
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
  tables: TableOverviewItem[];
  errors?: string[];
};

// Table status → theme token, shared visual language with the rest of the app
// (Front Desk / Table Map use the same semantic colors for these statuses).
const TABLE_STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-success text-white",
  OCCUPIED: "bg-destructive text-white",
  RESERVED: "bg-warning text-white",
  MAINTENANCE: "bg-muted text-muted-foreground",
};

// ── Component ─────────────────────────────────────────────────────────────
export default function DashboardClient({
  stats,
  orders,
  chartData: initialChartData,
  topItems,
  activities,
  tables,
  errors: serverErrors,
}: DashboardData) {
  const { user, restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [chartData, setChartData] = useState<ChartPoint[]>(initialChartData);
  const [isPending, startTransition] = useTransition();
  const [liveStats, setLiveStats] = useState(stats);
  const [liveOrders, setLiveOrders] = useState(orders);
  const [liveActivities, setLiveActivities] = useState(activities);
  const [liveTables, setLiveTables] = useState(tables);
  const [pollError, setPollError] = useState<string | null>(null);

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
      const failures: string[] = [];
      const [freshStats, freshOrders, freshActivities, freshTables] = await Promise.all([
        getDashboardStats(restaurantId).catch(() => { failures.push("stats"); return null; }),
        getRecentOrders(restaurantId, 10).catch(() => { failures.push("orders"); return null; }),
        getRecentActivity(restaurantId).catch(() => { failures.push("activity"); return null; }),
        getTableOverview(restaurantId).catch(() => { failures.push("tables"); return null; }),
      ]);
      if (freshStats) setLiveStats(freshStats);
      if (freshOrders) setLiveOrders(freshOrders);
      if (freshActivities) setLiveActivities(freshActivities);
      if (freshTables) setLiveTables(freshTables);
      // Surface a persistent live-update failure rather than silently leaving
      // the owner looking at stale data with no indication anything is wrong.
      setPollError(
        failures.length > 0
          ? `Live updates for ${failures.join(", ")} are currently failing — showing last known data.`
          : null
      );
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
        <CardContent className="p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {getGreeting()}, {user?.firstName || "Owner"}!
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              {liveStats?.todayOrders
                ? `Served ${liveStats.todayOrders} customers today.`
                : "Ready to serve!"}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-muted-foreground mb-1">Revenue Today</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              {formatCurrency(liveStats?.todayRevenue ?? 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Error banner ── */}
      {serverErrors && serverErrors.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Some data failed to load</p>
              <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                {serverErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Live-poll error banner (background refresh failures) ── */}
      {pollError && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-sm text-warning">{pollError}</p>
          </CardContent>
        </Card>
      )}

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
          <Card key={i} className="transition-shadow duration-300 hover:shadow-md">
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
                <ChartSkeleton />
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
                              item.isVeg ? "bg-success" : "bg-destructive"
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
                  href="/reception/tables"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View Full Map <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {liveTables.length > 0 ? (
                <>
                  {/* Each tile shows the table's real number and real status —
                      previously this rendered N generic squares (occupied-count
                      red, rest green) with no link to which physical table was
                      actually occupied. */}
                  <div className="grid grid-cols-5 gap-2 mb-6">
                    {liveTables.map((table) => (
                      <div
                        key={table.id}
                        title={`Table ${table.tableNumber} — ${table.status.charAt(0) + table.status.slice(1).toLowerCase()}`}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                          TABLE_STATUS_STYLES[table.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {table.tableNumber}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground border-t pt-4">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-success rounded-sm" />
                      {liveTables.filter((t) => t.status === "AVAILABLE").length} Available
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-destructive rounded-sm" />
                      {liveTables.filter((t) => t.status === "OCCUPIED").length} Occupied
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-warning rounded-sm" />
                      {liveTables.filter((t) => t.status === "RESERVED").length} Reserved
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
                href="/reception/orders"
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
                          ? "bg-success"
                          : a.type === "payment"
                          ? "bg-info"
                          : "bg-destructive"
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
