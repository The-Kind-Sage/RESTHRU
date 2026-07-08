'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Globe, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/format';
import { getRestaurantFullDetail } from '@/lib/actions/admin';

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-primary/10 text-primary border-primary/30',
    COMPLETED: 'bg-primary/10 text-primary border-primary/30',
    PENDING: 'bg-accent/10 text-accent border-accent/30',
    CANCELLED: 'bg-destructive/10 text-destructive border-destructive/30',
    PAID: 'bg-primary/10 text-primary border-primary/30',
    FAILED: 'bg-destructive/10 text-destructive border-destructive/30',
    AVAILABLE: 'bg-primary/10 text-primary border-primary/30',
    OCCUPIED: 'bg-accent/10 text-accent border-accent/30',
    RESERVED: 'bg-info/10 text-info border-info/30',
    true: 'bg-primary/10 text-primary border-primary/30',
    false: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  };
  return <Badge className={`border text-[10px] capitalize ${colors[status] || colors.pending}`}>{status.toLowerCase()}</Badge>;
};

export default function RestaurantDetail() {
  const params = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      getRestaurantFullDetail(params.id as string).then(setData);
    }
  }, [params.id]);

  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/restaurants">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted">
                <ArrowLeft className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Restaurant Details</h1>
              <p className="text-sm text-muted-foreground mt-1">Restaurant ID: {params.id}</p>
            </div>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  const { restaurant, orders, bills, staff, tables, notifications, activityLogs } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/restaurants">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{restaurant.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{restaurant.city}, {restaurant.state} &middot; {restaurant.type.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium text-foreground">{restaurant.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{restaurant.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">{restaurant.phoneNumber || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium text-foreground">{restaurant.city}, {restaurant.country}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{restaurant._count.orders}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{restaurant._count.staff}</p>
              <p className="text-xs text-muted-foreground">Staff</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{restaurant._count.tables}</p>
              <p className="text-xs text-muted-foreground">Tables</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{restaurant._count.menuItems}</p>
              <p className="text-xs text-muted-foreground">Menu Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-muted border border-border w-full justify-start overflow-auto flex-nowrap h-auto p-1 gap-0">
          {['orders', 'payments', 'staff', 'tables', 'subscription', 'tickets', 'documents', 'audit'].map((tab) => (
            <TabsTrigger key={tab} value={tab}
              className="text-xs px-4 py-2 text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-md capitalize whitespace-nowrap"
            >
              {tab === 'subscription' ? 'Subscription' : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No order history available</div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">#{o.orderId}</p>
                        <p className="text-xs text-muted-foreground">{o.orderType} &middot; {formatRelativeTime(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={o.status} />
                        <span className="text-sm font-medium text-foreground">{formatCurrency(o.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              {bills.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No payment history available</div>
              ) : (
                <div className="space-y-3">
                  {bills.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.billNumber}</p>
                        <p className="text-xs text-muted-foreground">{b.paymentMethod} &middot; {formatDate(b.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={b.status} />
                        <span className="text-sm font-medium text-foreground">{formatCurrency(b.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              {staff.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No staff data available</div>
              ) : (
                <div className="space-y-3">
                  {staff.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{s.firstName[0]}{s.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground">{s.role} &middot; {s.email || "N/A"}</p>
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              {tables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No table data available</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {tables.map((t: any) => (
                    <div key={t.id} className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                      <p className="text-xs text-muted-foreground">Table {t.tableNumber}</p>
                      <p className="text-lg font-bold text-foreground">{t.capacity}</p>
                      <p className="text-xs text-muted-foreground">seats</p>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              {restaurant.subscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No subscription data available</div>
              ) : (
                <div className="space-y-3">
                  {restaurant.subscriptions.map((s: any) => (
                    <div key={s.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-foreground">{s.plan.name} Plan</p>
                          <p className="text-xs text-muted-foreground">{s.billingCycle}</p>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Start:</span>
                          <span className="text-foreground ml-1">{formatDate(s.startDate)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">End:</span>
                          <span className="text-foreground ml-1">{formatDate(s.endDate)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Auto Renew:</span>
                          <span className="text-foreground ml-1">{s.autoRenew ? "Yes" : "No"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <span className="text-foreground ml-1">{formatCurrency(s.plan.monthlyPrice)}/mo</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No support tickets available</div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n: any) => (
                    <div key={n.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      <StatusBadge status={n.isRead ? "true" : "false"} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-muted-foreground text-sm">No documents available</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              {activityLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No audit trail available</div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div>
                        <p className="text-sm text-foreground">{log.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="border text-[10px] bg-muted text-muted-foreground border-border">{log.actionType}</Badge>
                          <span className="text-[10px] text-muted-foreground">{log.entityType}</span>
                          <span className="text-[10px] text-muted-foreground">{formatRelativeTime(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
