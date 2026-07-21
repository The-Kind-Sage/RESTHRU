import { getAllRestaurants } from "@/lib/actions/admin";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Building2, Users, UtensilsCrossed, Table2, ShoppingCart } from "lucide-react";
import { RestaurantActions, AddRestaurantButton } from "./restaurant-actions";
import { normalizePlanType, PLAN_LIMITS, PLAN_ORDER, type PlanType } from "@/lib/plan-limits";

// Which pack each restaurant is on, resolved from the plan *type* — the stable
// tier identity the platform gates on — rather than the marketing name (the PRO
// tier, for example, is named "Enterprise"). Restaurants without an active
// subscription fall back to FREE so they still show up.
function planOf(r: { subscriptions: { plan: { type: string } }[] }): PlanType {
  return normalizePlanType(r.subscriptions[0]?.plan.type);
}

function PlanBadge({ plan }: { plan: PlanType }) {
  const colors: Record<PlanType, string> = {
    ENTERPRISE: "bg-accent/10 text-accent border-accent/30",
    PRO: "bg-primary/10 text-primary border-primary/30",
    BASIC: "bg-info/10 text-info border-info/30",
    FREE: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30",
  };
  return <Badge className={`border ${colors[plan]}`}>{PLAN_LIMITS[plan].label}</Badge>;
}

export default async function AdminRestaurants() {
  const restaurants = await getAllRestaurants();

  // Plan distribution summary (Free included).
  const dist = restaurants.reduce<Partial<Record<PlanType, number>>>((acc, r) => {
    const plan = planOf(r);
    acc[plan] = (acc[plan] ?? 0) + 1;
    return acc;
  }, {});
  const distEntries = (Object.entries(dist) as [PlanType, number][]).sort(
    (a, b) => PLAN_ORDER.indexOf(a[0]) - PLAN_ORDER.indexOf(b[0])
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Restaurant Management"
        description="All restaurants on the platform and the pack each is subscribed to"
      >
        {restaurants.length > 0 &&
          distEntries.map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-1.5">
              <PlanBadge plan={plan} />
              <span className="text-xs text-muted-foreground">{count}</span>
            </div>
          ))}
        <AddRestaurantButton />
      </PageHeader>

      {restaurants.length === 0 ? (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-0">
            <EmptyState icon={Building2} title="No restaurants found" description="Restaurants will appear here once owners register on the platform." />
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Pack</TableHead>
                  <TableHead className="text-center"><Users className="inline h-3.5 w-3.5" /></TableHead>
                  <TableHead className="text-center"><UtensilsCrossed className="inline h-3.5 w-3.5" /></TableHead>
                  <TableHead className="text-center"><Table2 className="inline h-3.5 w-3.5" /></TableHead>
                  <TableHead className="text-center"><ShoppingCart className="inline h-3.5 w-3.5" /></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/superadmin/restaurants/${r.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.city}{r.state ? `, ${r.state}` : ""}
                    </TableCell>
                    <TableCell><PlanBadge plan={planOf(r)} /></TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{r._count.users}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{r._count.menuItems}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{r._count.tables}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{r._count.orders}</TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? "default" : "destructive"}>
                        {r.isActive ? "Active" : "Closed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <RestaurantActions
                        restaurant={{
                          id: r.id,
                          name: r.name,
                          email: r.email,
                          phoneNumber: r.phoneNumber,
                          street: r.street,
                          city: r.city,
                          state: r.state,
                          type: r.type,
                          isActive: r.isActive,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
