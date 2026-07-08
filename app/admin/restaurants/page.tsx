import { getAllRestaurants } from "@/lib/actions/admin";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, UtensilsCrossed, Table2, ShoppingCart } from "lucide-react";

export default async function AdminRestaurants() {
  const restaurants = await getAllRestaurants();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Restaurant Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all restaurants on the platform</p>
        </div>
      </div>

      {restaurants.length === 0 ? (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
              <p className="text-muted-foreground text-sm">No restaurants found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <Link key={r.id} href={`/admin/restaurants/${r.id}`}>
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{r.name}</h3>
                      <p className="text-xs text-muted-foreground">{r.city}{r.state ? `, ${r.state}` : ""}</p>
                    </div>
                    <Badge variant={r.isActive ? "default" : "secondary"}>
                      {r.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{r._count.users}</span>
                    <span className="flex items-center gap-1"><UtensilsCrossed className="h-3.5 w-3.5" />{r._count.menuItems}</span>
                    <span className="flex items-center gap-1"><Table2 className="h-3.5 w-3.5" />{r._count.tables}</span>
                    <span className="flex items-center gap-1"><ShoppingCart className="h-3.5 w-3.5" />{r._count.orders}</span>
                  </div>
                  {r.subscriptions[0] && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Plan: {r.subscriptions[0].plan.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
