import { getAdminStats, getAdminRecentOrders, getSubscriptionDistribution } from "@/lib/actions/admin";
import AdminClient from "./client";

export default async function AdminPage() {
  const [stats, recentOrders, subscriptionData] = await Promise.all([
    getAdminStats().catch(() => null),
    getAdminRecentOrders().catch(() => []),
    getSubscriptionDistribution().catch(() => []),
  ]);

  return (
    <AdminClient
      stats={stats}
      recentOrders={recentOrders}
      subscriptionData={subscriptionData}
    />
  );
}
