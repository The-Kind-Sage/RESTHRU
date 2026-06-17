import { getDashboardStats, getRecentOrders, getRevenueChartData, getTopSellingItems, getRecentActivity } from "@/lib/actions/dashboard";
import DashboardClient from "./client";

export default async function DashboardPage() {
  const restaurantId = "demo";

  const [stats, orders, chartData, topItems, activities] = await Promise.all([
    getDashboardStats(restaurantId).catch(() => null),
    getRecentOrders(restaurantId).catch(() => []),
    getRevenueChartData(restaurantId).catch(() => []),
    getTopSellingItems(restaurantId).catch(() => []),
    getRecentActivity(restaurantId).catch(() => []),
  ]);

  return (
    <DashboardClient
      stats={stats}
      orders={orders}
      chartData={chartData}
      topItems={topItems}
      activities={activities}
    />
  );
}
