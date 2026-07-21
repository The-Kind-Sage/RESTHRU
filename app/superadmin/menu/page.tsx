import { listRestaurantsWithMenuCounts } from "@/lib/actions/admin-menu";
import MenuManager from "./menu-manager";

// Menu data changes constantly (owners edit their own menus), so never cache.
export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const restaurants = await listRestaurantsWithMenuCounts();
  return <MenuManager initialRestaurants={restaurants} />;
}
