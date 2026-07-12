'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard, TrendingUp, Wallet, Users, ArrowUpRight, ArrowDownRight,
  RefreshCw, Mail, Plus, Search, Clock, AlertTriangle, CheckCircle2, XCircle,
  Percent, Hash, Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime, formatPercentage } from '@/lib/format';
import { getSubscriptionsOverview, getFailedPayments } from '@/lib/actions/admin';
import { getPromoCodes } from '@/lib/actions/promo-codes';

function KpiCard({ card }: { card: { title: string; value: string; subtitle?: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; trend?: string; trendUp?: boolean } }) {
  const Icon = card.icon;
  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {card.title}
        </CardTitle>
        <Icon className="h-4.5 w-4.5 text-primary/60 group-hover:text-primary transition-colors" strokeWidth={1.5} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground tracking-tight">{card.value}</div>
        {card.subtitle && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtitle}</p>
        )}
        {card.trend && (
          <div className="flex items-center gap-1 mt-2">
            {card.trendUp ? (
              <ArrowUpRight className="h-3 w-3 text-primary" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-destructive" />
            )}
            <span className={`text-xs ${card.trendUp ? 'text-primary' : 'text-destructive'}`}>
              {card.trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: 'bg-primary/10 text-primary border-primary/30',
    pending: 'bg-accent/10 text-accent border-accent/30',
    failed: 'bg-destructive/10 text-destructive border-destructive/30',
    overdue: 'bg-destructive/10 text-destructive border-destructive/30',
    active: 'bg-primary/10 text-primary border-primary/30',
    inactive: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  };
  return <Badge className={`border capitalize ${colors[status] || colors.pending}`}>{status}</Badge>;
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    Enterprise: 'bg-accent/10 text-accent border-accent/30',
    Pro: 'bg-primary/10 text-primary border-primary/30',
    Basic: 'bg-info/10 text-info border-info/30',
    Free: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  };
  return <Badge className={`border ${colors[plan] || colors.Free}`}>{plan}</Badge>;
}

export default function AdminSubscriptions() {
  const [promoSearch, setPromoSearch] = useState('');
  const [data, setData] = useState<any>(null);
  const [failedPayments, setFailedPayments] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);

  useEffect(() => {
    getSubscriptionsOverview().then(setData);
    getFailedPayments().then(setFailedPayments);
    getPromoCodes().then(setPromos);
  }, []);

  const filteredPromos = promos.filter((p) =>
    !promoSearch || p.code.toLowerCase().includes(promoSearch.toLowerCase()) || (p.description || '').toLowerCase().includes(promoSearch.toLowerCase())
  );

  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Subscription & Billing</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage subscriptions, invoices, and promotional codes</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
              Auto-billing active
            </Badge>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Subscription & Billing"
        description="Manage subscriptions, invoices, and promotional codes"
      >
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          Auto-billing active
        </Badge>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard card={{ title: "Total Subscriptions", value: formatNumber(data.totalSubscriptions), icon: CreditCard }} />
        <KpiCard card={{ title: "Active", value: formatNumber(data.activeSubscriptions), subtitle: `${formatPercentage(1 - data.churnRate)} active rate`, icon: TrendingUp, trend: "Active", trendUp: true }} />
        <KpiCard card={{ title: "Inactive", value: formatNumber(data.inactiveSubscriptions), subtitle: `${formatPercentage(data.churnRate)} churn`, icon: Users, trend: "Churned", trendUp: false }} />
        <KpiCard card={{ title: "Monthly Recurring Revenue", value: formatCurrency(Math.round(data.mrr)), icon: Wallet }} />
        <KpiCard card={{ title: "Churn Rate", value: formatPercentage(data.churnRate), icon: Percent }} />
      </div>

      {/* MRR Trend Chart */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-foreground">MRR Trend</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly recurring revenue over the last 12 months</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground">Revenue</span>
          </div>
        </CardHeader>
        <CardContent>
          {data.mrrTrend.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No trend data available</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.mrrTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Renewals */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-foreground">Upcoming Renewals</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Restaurants with renewals due in the next 30 days</p>
          </div>
          <Button variant="outline" size="sm" className="border-border text-primary hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Process All
          </Button>
        </CardHeader>
        <CardContent>
          {data.upcomingRenewals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No renewals data available</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.upcomingRenewals.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-foreground">{s.restaurant.name}</TableCell>
                    <TableCell><PlanBadge plan={s.plan.name} /></TableCell>
                    <TableCell><StatusBadge status={s.status.toLowerCase()} /></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(s.endDate)}</TableCell>
                    <TableCell className="text-foreground font-medium">{formatCurrency(s.plan.monthlyPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Failed Payments */}
      <Card className="bg-card border-border shadow-sm border-l-2 border-l-[#DB3A3A]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <div>
              <CardTitle className="text-sm font-medium text-foreground">Failed Payments</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{failedPayments.length} payments require attention</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-border text-destructive hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry All
          </Button>
        </CardHeader>
        <CardContent>
          {failedPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No failed payments</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedPayments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-foreground">{p.restaurant}</TableCell>
                    <TableCell className="text-destructive font-medium">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(p.date)}</TableCell>
                    <TableCell><StatusBadge status="failed" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Management */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-foreground">Invoice Management</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">View and manage all platform invoices</p>
          </div>
          <Button size="sm" className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-muted border border-border h-8 mb-4">
              <TabsTrigger value="all" className="text-[10px] px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">All</TabsTrigger>
              <TabsTrigger value="paid" className="text-[10px] px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Paid</TabsTrigger>
              <TabsTrigger value="pending" className="text-[10px] px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Pending</TabsTrigger>
              <TabsTrigger value="overdue" className="text-[10px] px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Overdue</TabsTrigger>
            </TabsList>
            {['all', 'paid', 'pending', 'overdue'].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                {data.allSubscriptions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">No invoices</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.allSubscriptions
                        .filter((s: any) => tab === "all" || s.status.toLowerCase() === tab)
                        .slice(0, 10)
                        .map((s: any) => (
                          <TableRow key={s.id}>
                            <TableCell className="text-foreground">{s.restaurant.name}</TableCell>
                            <TableCell><PlanBadge plan={s.plan.name} /></TableCell>
                            <TableCell><StatusBadge status={s.status.toLowerCase()} /></TableCell>
                            <TableCell className="text-muted-foreground text-xs">{formatDate(s.startDate)}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{formatDate(s.endDate)}</TableCell>
                            <TableCell className="text-foreground font-medium">{formatCurrency(s.plan.monthlyPrice)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Promo Code Management */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-foreground">Promo Code Management</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Create and manage discount codes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search codes..."
                value={promoSearch}
                onChange={(e) => setPromoSearch(e.target.value)}
                className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground text-xs h-9 w-48"
              />
            </div>
            <Button size="sm" className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPromos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">{promoSearch ? 'No promo codes match your search' : 'No promo codes yet. Create one to get started.'}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromos.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm text-foreground font-medium">{p.code}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.description || '-'}</TableCell>
                    <TableCell>
                      <Badge className="border text-[10px] bg-primary/10 text-primary border-primary/30">
                        {p.discountType === 'percentage' ? `${p.discountValue}%` : formatCurrency(p.discountValue)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.usageCount || 0}{p.usageLimit ? ` / ${p.usageLimit}` : ''}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.expiresAt ? formatDate(p.expiresAt) : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
