'use client';

import React, { useState } from 'react';
import {
  TrendingUp, ShoppingCart, Utensils, Building2, Wallet, Clock,
  ArrowUpRight, ArrowDownRight, Download, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';

const datePresets = ['7D', '30D', '90D', '1Y'];

const kpiCards = [
  {
    title: 'Total Restaurant Revenue',
    value: 'NPR 2,85,00,000',
    subtitle: 'Platform-wide gross revenue',
    icon: Wallet,
    trend: '+22.3% vs last period',
    trendUp: true,
  },
  {
    title: 'Avg Order Value',
    value: 'NPR 1,250',
    subtitle: 'Per transaction average',
    icon: TrendingUp,
    trend: '+8.5% vs last period',
    trendUp: true,
  },
  {
    title: 'Platform-wide Orders',
    value: '1,84,700',
    subtitle: 'Total orders this period',
    icon: ShoppingCart,
    trend: '+15.2% vs last period',
    trendUp: true,
  },
  {
    title: 'Active Restaurants',
    value: '485',
    subtitle: 'Of 547 total registered',
    icon: Building2,
    trend: '+12 this period',
    trendUp: true,
  },
];

const revenueOverTime = [
  { month: 'Jan', revenue: 1800000 },
  { month: 'Feb', revenue: 1950000 },
  { month: 'Mar', revenue: 2100000 },
  { month: 'Apr', revenue: 2050000 },
  { month: 'May', revenue: 2400000 },
  { month: 'Jun', revenue: 2500000 },
  { month: 'Jul', revenue: 2750000 },
  { month: 'Aug', revenue: 2650000 },
  { month: 'Sep', revenue: 2900000 },
  { month: 'Oct', revenue: 3100000 },
  { month: 'Nov', revenue: 3350000 },
  { month: 'Dec', revenue: 3600000 },
];

const popularCuisines = [
  { name: 'Momo', value: 35 },
  { name: 'Thakali', value: 22 },
  { name: 'Newari', value: 18 },
  { name: 'Biryani', value: 15 },
  { name: 'Chowmein', value: 10 },
];

const paymentMethodData = [
  { name: 'eSewa', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Khalti', value: 28, color: 'hsl(var(--info))' },
  { name: 'Fonepay', value: 15, color: 'hsl(var(--accent))' },
  { name: 'Cash', value: 12, color: 'hsl(var(--muted-foreground))' },
];

interface CityRevenue {
  city: string;
  revenue: number;
  orders: number;
  growth: string;
  growthUp: boolean;
}

const cityRevenueData: CityRevenue[] = [
  { city: 'Kathmandu', revenue: 12500000, orders: 78500, growth: '+18%', growthUp: true },
  { city: 'Pokhara', revenue: 5800000, orders: 41200, growth: '+22%', growthUp: true },
  { city: 'Chitwan', revenue: 2100000, orders: 15800, growth: '+12%', growthUp: true },
  { city: 'Lalitpur', revenue: 1950000, orders: 14200, growth: '+15%', growthUp: true },
  { city: 'Bhaktapur', revenue: 1400000, orders: 10500, growth: '+8%', growthUp: true },
  { city: 'Dhulikhel', revenue: 850000, orders: 6200, growth: '+28%', growthUp: true },
  { city: 'Ilam', revenue: 520000, orders: 3800, growth: '+35%', growthUp: true },
];

const peakHoursData = [
  { hour: '11 AM', orders: 320 },
  { hour: '12 PM', orders: 580 },
  { hour: '1 PM', orders: 720 },
  { hour: '2 PM', orders: 480 },
  { hour: '3 PM', orders: 310 },
  { hour: '4 PM', orders: 280 },
  { hour: '5 PM', orders: 450 },
  { hour: '6 PM', orders: 780 },
  { hour: '7 PM', orders: 920 },
  { hour: '8 PM', orders: 850 },
  { hour: '9 PM', orders: 620 },
  { hour: '10 PM', orders: 380 },
];

interface FeatureAdoption {
  feature: string;
  adoption: number;
}

const featureAdoptionData: FeatureAdoption[] = [
  { feature: 'Menu Management', adoption: 92 },
  { feature: 'QR Codes', adoption: 85 },
  { feature: 'Staff Management', adoption: 68 },
  { feature: 'Online Orders', adoption: 76 },
  { feature: 'Inventory', adoption: 54 },
  { feature: 'Reports', adoption: 61 },
];

const ColoredBadge = ({ label, color }: { label: string; color: string }) => (
  <Badge
    className="border text-[10px]"
    style={{
      backgroundColor: `${color}10`,
      color: color,
      borderColor: `${color}30`,
    }}
  >
    {label}
  </Badge>
);

export default function AdminAnalytics() {
  const [activePeriod, setActivePeriod] = useState('30D');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep insights into platform performance and growth</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
            <Download className="h-4 w-4 mr-1.5" /> Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-1">Period:</span>
        {datePresets.map((preset) => (
          <button
            key={preset}
            onClick={() => setActivePeriod(preset)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activePeriod === preset
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-muted text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="bg-card border-border shadow-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </CardTitle>
                <Icon className="h-4.5 w-4.5 text-primary/60 group-hover:text-primary transition-colors" strokeWidth={1.5} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground tracking-tight">{card.value}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtitle}</p>
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-foreground">Revenue Over Time</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue trend for the selected period</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[10px] text-muted-foreground">Revenue</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(1)}L`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Cuisines */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Popular Cuisines</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Order distribution by cuisine type</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={popularCuisines} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value}%`, 'Share']}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {popularCuisines.map((c) => (
                <div key={c.name} className="text-center">
                  <div className="text-sm font-medium text-foreground">{c.value}%</div>
                  <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method Distribution */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Payment Methods</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Distribution across payment gateways</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                >
                  {paymentMethodData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {paymentMethodData.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-muted-foreground">{p.name}</span>
                  <span className="text-xs text-foreground/60 ml-auto">{p.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Cities by Revenue */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Top Cities by Revenue</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue contribution by city</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">City</TableHead>
                  <TableHead className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider text-right">Revenue</TableHead>
                  <TableHead className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider text-right">Orders</TableHead>
                  <TableHead className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider text-right">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cityRevenueData.map((c) => (
                  <TableRow key={c.city} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="text-sm font-medium text-foreground">{c.city}</TableCell>
                    <TableCell className="text-right text-foreground/70 text-sm">{formatCurrency(c.revenue)}</TableCell>
                    <TableCell className="text-right text-foreground/70 text-sm">{formatNumber(c.orders)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-xs font-medium ${c.growthUp ? 'text-primary' : 'text-destructive'}`}>
                        {c.growth}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Peak Hours</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Order volume by hour of day</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [formatNumber(value), 'Orders']}
                />
                <Area type="monotone" dataKey="orders" stroke="hsl(var(--accent))" fill="url(#peakGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature Adoption */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-foreground">Feature Adoption</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Percentage of active restaurants using each feature</p>
          </div>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {featureAdoptionData.map((f) => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground/80">{f.feature}</span>
                  <span className="text-xs font-medium text-primary">{f.adoption}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${f.adoption}%`,
                      background: f.adoption >= 80
                        ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-hover)))'
                        : f.adoption >= 60
                        ? 'linear-gradient(90deg, #F4B740, #E5A530)'
                        : 'linear-gradient(90deg, #DB3A3A, #B82E2E)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
