import { getAdminStats, getRecentOrders } from "@/lib/actions/admin";
import AdminClient from "./client";

export default async function AdminPage() {
  const [stats, recentOrders] = await Promise.all([
    getAdminStats().catch(() => null),
    getRecentOrders().catch(() => []),
  ]);

  return (
    <AdminClient
      stats={stats}
      recentOrders={recentOrders}
    />
  );
}
