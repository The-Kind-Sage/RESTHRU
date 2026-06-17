'use client';

import React, { useState } from 'react';
import {
  Building2,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  ShoppingCart,
  IndianRupee,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { formatCurrency, formatNumber, formatPercentage, formatRelativeTime } from '@/lib/format';

// ─── KPI Data ───
const kpiCards = [
  {
    title: 'Total Restaurants',
    value: '547',
    subtitle: 'Free: 191 · Basic: 164 · Pro: 137 · Ent: 55',
    icon: Building2,
    trend: '+12 this month',
    trendUp: true,
  },
  {
    title: 'MRR',
    value: 'NPR 12,45,000',
    subtitle: '↑ 18.7% MoM',
    icon: TrendingUp,
    trend: '+NPR 1,96,000',
    trendUp: true,
  },
  {
    title: 'Active Today',
    value: '312',
    subtitle: '57% of total',
    icon: Activity,
    trend: '+8 vs yesterday',
    trendUp: true,
  },
  {
    title: 'New Signups (MTD)',
    value: '47',
    subtitle: 'Pro: 18 · Basic: 14 · Free: 12 · Ent: 3',
    icon: UserPlus,
    trend: '+23% vs last month',
    trendUp: true,
  },
  {
    title: 'Churn Rate',
    value: '2.4%',
    subtitle: 'Last 30 days',
    icon: TrendingDown,
    trend: '-0.3% improvement',
    trendUp: true,
  },
  {
    title: 'ARPU',
    value: 'NPR 4,280',
    subtitle: 'Per active restaurant',
    icon: Users,
    trend: '+NPR 320',
    trendUp: true,
  },
  {
    title: 'Today\'s Orders',
    value: '1,847',
    subtitle: 'Platform-wide',
    icon: ShoppingCart,
    trend: '+14.2% vs same day',
    trendUp: true,
  },
  {
    title: 'Total GMV (MTD)',
    value: 'NPR 2.3Cr',
    subtitle: 'Gross Merchandise Value',
    icon: Wallet,
    trend: '+22.1%',
    trendUp: true,
  },
];

// ─── MRR Data ───
const mrrData = [
  { month: 'Jan', revenue: 800000, forecast: null },
  { month: 'Feb', revenue: 850000, forecast: null },
  { month: 'Mar', revenue: 920000, forecast: null },
  { month: 'Apr', revenue: 980000, forecast: null },
  { month: 'May', revenue: 1050000, forecast: null },
  { month: 'Jun', revenue: 1120000, forecast: null },
  { month: 'Jul', revenue: 1245000, forecast: null },
  { month: 'Aug', revenue: null, forecast: 1350000 },
  { month: 'Sep', revenue: null, forecast: 1480000 },
  { month: 'Oct', revenue: null, forecast: 1620000 },
];

const COLORS = {
  primary: '#12B877',
  primaryDim: 'rgba(18,184,119,0.15)',
  accent: '#F4B740',
  destructive: '#DB3A3A',
  info: '#3B82F6',
  muted: '#768B80',
  surface: '#0D1711',
  border: '#25332B',
};

const PieColors = ['#12B877', '#3B82F6', '#F4B740', '#DB3A3A', '#768B80'];

// ─── Subscription Distribution ───
const subscriptionData = [
  { name: 'Free', value: 191, percentage: 35 },
  { name: 'Basic', value: 164, percentage: 30 },
  { name: 'Pro', value: 137, percentage: 25 },
  { name: 'Enterprise', value: 55, percentage: 10 },
];

// ─── Activity Feed ───
interface Activity {
  id: number;
  type: 'signup' | 'upgrade' | 'payment' | 'offline' | 'support' | 'alert';
  text: string;
  time: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
}

const initialActivities: Activity[] = [
  { id: 1, type: 'signup', text: 'Sagarmatha Palace signed up for Pro plan', time: '12 min ago', severity: 'success' },
  { id: 2, type: 'upgrade', text: 'Pokhara Grill upgraded to Enterprise', time: '28 min ago', severity: 'success' },
  { id: 3, type: 'payment', text: 'Himalayan Kitchen payment of NPR 45,000 failed', time: '42 min ago', severity: 'error' },
  { id: 4, type: 'support', text: 'Urgent: Newari Delights — POS sync issue', time: '1h ago', severity: 'warning' },
  { id: 5, type: 'offline', text: 'Langtang Lodge went offline', time: '1h ago', severity: 'error' },
  { id: 6, type: 'alert', text: 'Server CPU at 78% — auto-scaling triggered', time: '2h ago', severity: 'warning' },
  { id: 7, type: 'signup', text: 'Mustang Bistro signed up for Basic plan', time: '2h ago', severity: 'success' },
  { id: 8, type: 'payment', text: 'Thakali House paid NPR 1,25,000 invoice', time: '3h ago', severity: 'info' },
  { id: 9, type: 'upgrade', text: 'Dhulikhel Traditional upgraded to Pro', time: '4h ago', severity: 'success' },
  { id: 10, type: 'support', text: 'Chitwan Wildlife Cafe — menu sync error resolved', time: '5h ago', severity: 'info' },
];

// ─── Top Restaurants ───
const topRestaurants = [
  { rank: 1, name: 'Langtang Lodge', city: 'Kathmandu', revenue: 325000, orders: 1240, satisfaction: 4.8, plan: 'Enterprise' },
  { rank: 2, name: 'Thakali House', city: 'Pokhara', revenue: 285000, orders: 980, satisfaction: 4.7, plan: 'Enterprise' },
  { rank: 3, name: 'Pokhara Grill', city: 'Pokhara', revenue: 185000, orders: 745, satisfaction: 4.6, plan: 'Pro' },
  { rank: 4, name: 'Himalayan Kitchen', city: 'Kathmandu', revenue: 125000, orders: 520, satisfaction: 4.5, plan: 'Pro' },
  { rank: 5, name: 'Chitwan Wildlife Cafe', city: 'Chitwan', revenue: 165000, orders: 620, satisfaction: 4.4, plan: 'Pro' },
];

// ─── At-Risk Restaurants ───
const atRiskRestaurants = [
  { name: 'Nuwakot Dining', city: 'Bhaktapur', risk: 92, reason: 'Missed payment · 21d inactive', action: 'Send reminder & offer discount' },
  { name: 'Ilam Coffee & Kitchen', city: 'Ilam', risk: 78, reason: 'Orders down 65% in 14d', action: 'Call owner to check' },
  { name: 'Kathmandu Cafe', city: 'Kathmandu', risk: 65, reason: 'Trial ending in 3 days', action: 'Send conversion offer' },
  { name: 'Manang Heritage', city: 'Pokhara', risk: 55, reason: 'Staff not using features', action: 'Schedule training call' },
];

// ─── City Distribution ───
const cityData = [
  { city: 'Kathmandu', count: 245, growth: '+12%' },
  { city: 'Pokhara', count: 112, growth: '+18%' },
  { city: 'Chitwan', count: 48, growth: '+8%' },
  { city: 'Lalitpur', count: 42, growth: '+15%' },
  { city: 'Bhaktapur', count: 35, growth: '+5%' },
  { city: 'Dhulikhel', count: 22, growth: '+25%' },
  { city: 'Ilam', count: 18, growth: '+40%' },
  { city: 'Other', count: 25, growth: '+10%' },
];

// ─── Revenue Forecast ───
const forecastData = {
  nextMonth: 'NPR 13,50,000',
  nextQuarter: 'NPR 44,50,000',
  confidence: 87,
  drivers: ['Peak wedding season', '18 trial conversions expected', '3 Enterprise upgrades pending'],
};

// ─── Signup Trend ───
const signupTrendData = [
  { month: 'Jan', signups: 32 },
  { month: 'Feb', signups: 28 },
  { month: 'Mar', signups: 38 },
  { month: 'Apr', signups: 35 },
  { month: 'May', signups: 42 },
  { month: 'Jun', signups: 40 },
  { month: 'Jul', signups: 47 },
];

// ─── Activity icon + color map ───
const activityConfig: Record<string, { icon: React.ElementType; color: string }> = {
  signup: { icon: UserPlus, color: 'text-[#12B877]' },
  upgrade: { icon: ArrowUpRight, color: 'text-[#3B82F6]' },
  payment: { icon: Wallet, color: 'text-[#F4B740]' },
  offline: { icon: Activity, color: 'text-[#DB3A3A]' },
  support: { icon: Headphones, color: 'text-[#F4B740]' },
  alert: { icon: AlertTriangle, color: 'text-[#DB3A3A]' },
};

import { Headphones } from 'lucide-react';

function KpiCard({ card }: { card: typeof kpiCards[0] }) {
  const Icon = card.icon;
  return (
    <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card hover:shadow-admin-card-hover transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-[#768B80] uppercase tracking-wider">
          {card.title}
        </CardTitle>
        <Icon className="h-4.5 w-4.5 text-[#12B877]/60 group-hover:text-[#12B877] transition-colors" strokeWidth={1.5} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
        {card.subtitle && (
          <p className="text-[11px] text-[#768B80] mt-0.5">{card.subtitle}</p>
        )}
        {card.trend && (
          <div className="flex items-center gap-1 mt-2">
            {card.trendUp ? (
              <ArrowUpRight className="h-3 w-3 text-[#12B877]" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-[#DB3A3A]" />
            )}
            <span className={`text-xs ${card.trendUp ? 'text-[#12B877]' : 'text-[#DB3A3A]'}`}>
              {card.trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [activities] = useState<Activity[]>(initialActivities);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#768B80] mt-1">
            Real-time platform overview · Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-[#12B877]/30 text-[#12B877] bg-[#12B877]/5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#12B877] mr-1.5 animate-pulse" />
            Live
          </Badge>
          <Button variant="outline" size="sm" className="border-[#25332B] text-[#768B80] hover:text-white hover:border-[#12B877]/30">
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.title} card={card} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR + Forecast Chart */}
        <Card className="lg:col-span-2 bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-white">MRR Growth & Forecast</CardTitle>
              <p className="text-xs text-[#768B80] mt-0.5">Actual + AI-predicted revenue</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#12B877]" />
                <span className="text-[10px] text-[#768B80]">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F4B740]" />
                <span className="text-[10px] text-[#768B80]">Forecast</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4 mb-4">
              <div>
                <p className="text-xs text-[#768B80]">Current MRR</p>
                <p className="text-2xl font-bold text-white">NPR 12,45,000</p>
              </div>
              <div>
                <p className="text-xs text-[#768B80]">Next Month</p>
                <p className="text-lg font-semibold text-[#F4B740]">{forecastData.nextMonth}</p>
              </div>
              <div>
                <p className="text-xs text-[#768B80]">Next Quarter</p>
                <p className="text-lg font-semibold text-[#F4B740]">{forecastData.nextQuarter}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={mrrData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#12B877" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#12B877" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4B740" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F4B740" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#25332B" />
                <XAxis dataKey="month" stroke="#768B80" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#768B80" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(1)}L`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1711', border: '1px solid #25332B', borderRadius: '8px' }}
                  labelStyle={{ color: '#EDEDED' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#12B877" fill="url(#mrrGrad)" strokeWidth={2} connectNulls={false} />
                <Area type="monotone" dataKey="forecast" stroke="#F4B740" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="6 3" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Column: Subscriptions + Signups */}
        <div className="space-y-6">
          {/* Subscription Distribution */}
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white">Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={subscriptionData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none">
                    {subscriptionData.map((_, i) => (
                      <Cell key={i} fill={PieColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D1711', border: '1px solid #25332B', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [`${value} restaurants`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {subscriptionData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PieColors[i] }} />
                    <span className="text-xs text-[#768B80]">{item.name}</span>
                    <span className="text-xs text-white/60 ml-auto">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Signup Trend */}
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white">New Signups (MTD)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={signupTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#25332B" vertical={false} />
                  <XAxis dataKey="month" stroke="#768B80" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D1711', border: '1px solid #25332B', borderRadius: '8px' }}
                    labelStyle={{ color: '#EDEDED' }}
                  />
                  <Bar dataKey="signups" fill="#12B877" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Activity + Top Restaurants + At-Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-medium text-white">Live Activity</CardTitle>
              <p className="text-xs text-[#768B80] mt-0.5">Real-time platform events</p>
            </div>
            <Badge variant="outline" className="border-[#12B877]/30 text-[#12B877] bg-[#12B877]/5 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#12B877] mr-1.5 animate-pulse" />
              Streaming
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#25332B]">
              {activities.map((activity) => {
                const config = activityConfig[activity.type] || activityConfig.alert;
                const ActIcon = config.icon;
                const dotColor = activity.severity === 'error' ? '#DB3A3A'
                  : activity.severity === 'warning' ? '#F4B740'
                  : activity.severity === 'success' ? '#12B877'
                  : '#3B82F6';
                return (
                  <div key={activity.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#1A231E]/50 transition-colors">
                    <div className="h-6 w-6 rounded-full bg-[#1A231E] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ActIcon className="h-3 w-3 text-[#768B80]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">{activity.text}</p>
                      <p className="text-[10px] text-[#768B80] mt-0.5">{activity.time}</p>
                    </div>
                    <span className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: dotColor }} />
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-[#25332B]">
              <Button variant="ghost" size="sm" className="w-full text-xs text-[#12B877] hover:text-white">
                View Full Activity Log
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Restaurants */}
        <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white">Top Performers</CardTitle>
            <p className="text-xs text-[#768B80] mt-0.5">Ranked by revenue, orders & satisfaction</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#25332B]">
              {topRestaurants.map((r) => (
                <div key={r.rank} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1A231E]/50 transition-colors">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-[#1A231E] text-xs font-bold text-[#768B80]">
                    {r.rank === 1 ? (
                      <Star className="h-3.5 w-3.5 text-[#F4B740] fill-[#F4B740]" />
                    ) : (
                      `#${r.rank}`
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.name}</p>
                    <p className="text-xs text-[#768B80]">{r.city} · {r.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{formatCurrency(r.revenue)}</p>
                    <p className="text-xs text-[#768B80]">{formatNumber(r.orders)} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* At-Risk Restaurants */}
        <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-white">At-Risk Restaurants</CardTitle>
                <p className="text-xs text-[#768B80] mt-0.5">AI-predicted churn risk</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-[#F4B740]" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#25332B]">
              {atRiskRestaurants.map((r) => (
                <div key={r.name} className="px-4 py-3 hover:bg-[#1A231E]/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.name}</p>
                      <p className="text-xs text-[#768B80]">{r.city}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-[#DB3A3A]/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#DB3A3A]">{r.risk}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#768B80] mb-2">{r.reason}</p>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#25332B] text-[#12B877] hover:bg-[#12B877]/10 w-full">
                    <Zap className="h-3 w-3 mr-1" />
                    {r.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-white">Geographic Distribution</CardTitle>
              <p className="text-xs text-[#768B80] mt-0.5">Restaurant concentration across Nepal</p>
            </div>
            <Tabs defaultValue="city" className="w-auto">
              <TabsList className="bg-[#1A231E] border border-[#25332B] h-8">
                <TabsTrigger value="city" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">City</TabsTrigger>
                <TabsTrigger value="district" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">District</TabsTrigger>
                <TabsTrigger value="province" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">Province</TabsTrigger>
              </TabsList>
              <TabsContent value="city" />
              <TabsContent value="district" />
              <TabsContent value="province" />
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cityData.map((city) => {
              const maxCount = Math.max(...cityData.map((c) => c.count));
              const barWidth = (city.count / maxCount) * 100;
              return (
                <div key={city.city} className="p-3 rounded-lg bg-[#1A231E]/50 border border-[#25332B]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{city.city}</span>
                    <span className="text-xs text-[#12B877]">{city.growth}</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">{city.count}</div>
                  <div className="h-1.5 rounded-full bg-[#1A231E] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#12B877] to-[#0E945E] transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Revenue Forecast */}
      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card border-l-2 border-l-[#12B877]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-[#12B877]/10 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-[#12B877]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-white">AI-Powered Revenue Forecast</h3>
                <Badge className="bg-[#12B877]/10 text-[#12B877] border border-[#12B877]/30 text-[10px]">87% confidence</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs text-[#768B80]">Next Month Forecast</p>
                  <p className="text-lg font-bold text-white">{forecastData.nextMonth}</p>
                </div>
                <div>
                  <p className="text-xs text-[#768B80]">Next Quarter Forecast</p>
                  <p className="text-lg font-bold text-white">{forecastData.nextQuarter}</p>
                </div>
                <div>
                  <p className="text-xs text-[#768B80]">AI Confidence Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-[#1A231E] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#F4B740] to-[#12B877]" style={{ width: `${forecastData.confidence}%` }} />
                    </div>
                    <span className="text-sm font-medium text-white">{forecastData.confidence}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {forecastData.drivers.map((d, i) => (
                  <Badge key={i} variant="outline" className="border-[#25332B] text-[#768B80] text-[10px]">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
