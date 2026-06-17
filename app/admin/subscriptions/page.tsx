'use client';

import React, { useState } from 'react';
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
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime, formatPercentage } from '@/lib/format';

const kpiCards = [
  {
    title: 'Monthly Recurring Revenue',
    value: 'NPR 12,45,000',
    subtitle: '↑ 18.7% MoM',
    icon: TrendingUp,
    trend: '+NPR 1,96,000',
    trendUp: true,
  },
  {
    title: 'Annual Recurring Revenue',
    value: 'NPR 1,49,40,000',
    subtitle: 'Projected annual run rate',
    icon: CreditCard,
    trend: '+22.3% YoY',
    trendUp: true,
  },
  {
    title: 'Avg LTV',
    value: 'NPR 1,85,000',
    subtitle: 'Per restaurant lifetime value',
    icon: Wallet,
    trend: '+NPR 12,500',
    trendUp: true,
  },
  {
    title: 'CAC',
    value: 'NPR 18,500',
    subtitle: 'Avg customer acquisition cost',
    icon: Users,
    trend: '-8.2%',
    trendUp: true,
  },
  {
    title: 'Churn Rate',
    value: '2.4%',
    subtitle: 'Last 30 days (0.3% improvement)',
    icon: ArrowDownRight,
    trend: '-0.3%',
    trendUp: true,
  },
];

const mrrTrendData = [
  { month: 'Jan', revenue: 800000 },
  { month: 'Feb', revenue: 850000 },
  { month: 'Mar', revenue: 920000 },
  { month: 'Apr', revenue: 980000 },
  { month: 'May', revenue: 1050000 },
  { month: 'Jun', revenue: 1120000 },
  { month: 'Jul', revenue: 1245000 },
  { month: 'Aug', revenue: 1350000 },
  { month: 'Sep', revenue: 1420000 },
  { month: 'Oct', revenue: 1510000 },
  { month: 'Nov', revenue: 1620000 },
  { month: 'Dec', revenue: 1740000 },
];

interface Renewal {
  id: number;
  restaurant: string;
  plan: string;
  amount: number;
  renewalDate: string;
  daysLeft: number;
  status: 'paid' | 'pending' | 'failed';
}

const upcomingRenewals: Renewal[] = [
  { id: 1, restaurant: 'Langtang Lodge', plan: 'Enterprise', amount: 125000, renewalDate: '2025-01-25', daysLeft: 3, status: 'pending' },
  { id: 2, restaurant: 'Thakali House', plan: 'Enterprise', amount: 125000, renewalDate: '2025-01-28', daysLeft: 6, status: 'pending' },
  { id: 3, restaurant: 'Pokhara Grill', plan: 'Pro', amount: 45000, renewalDate: '2025-02-01', daysLeft: 10, status: 'pending' },
  { id: 4, restaurant: 'Himalayan Kitchen', plan: 'Pro', amount: 45000, renewalDate: '2025-01-22', daysLeft: 0, status: 'failed' },
  { id: 5, restaurant: 'Newari Delights', plan: 'Basic', amount: 15000, renewalDate: '2025-02-05', daysLeft: 14, status: 'pending' },
  { id: 6, restaurant: 'Dhulikhel Traditional', plan: 'Pro', amount: 45000, renewalDate: '2025-01-30', daysLeft: 8, status: 'paid' },
  { id: 7, restaurant: 'Chitwan Wildlife Cafe', plan: 'Pro', amount: 45000, renewalDate: '2025-02-10', daysLeft: 19, status: 'pending' },
  { id: 8, restaurant: 'Ilam Coffee & Kitchen', plan: 'Basic', amount: 15000, renewalDate: '2025-01-20', daysLeft: -2, status: 'failed' },
];

interface FailedPayment {
  id: number;
  restaurant: string;
  amount: number;
  date: string;
  daysOverdue: number;
  method: string;
}

const failedPayments: FailedPayment[] = [
  { id: 1, restaurant: 'Himalayan Kitchen', amount: 45000, date: '2025-01-10', daysOverdue: 12, method: 'eSewa' },
  { id: 2, restaurant: 'Ilam Coffee & Kitchen', amount: 15000, date: '2025-01-05', daysOverdue: 17, method: 'Khalti' },
  { id: 3, restaurant: 'Nuwakot Dining', amount: 15000, date: '2024-12-28', daysOverdue: 25, method: 'Bank' },
  { id: 4, restaurant: 'Kathmandu Cafe', amount: 0, date: '2025-01-12', daysOverdue: 10, method: 'Fonepay' },
];

interface Invoice {
  id: string;
  restaurant: string;
  amount: number;
  method: string;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
}

const invoices: Invoice[] = [
  { id: 'INV-2025-001', restaurant: 'Langtang Lodge', amount: 125000, method: 'eSewa', status: 'paid', date: '2025-01-15' },
  { id: 'INV-2025-002', restaurant: 'Thakali House', amount: 125000, method: 'Bank', status: 'paid', date: '2025-01-14' },
  { id: 'INV-2025-003', restaurant: 'Pokhara Grill', amount: 45000, method: 'Khalti', status: 'paid', date: '2025-01-12' },
  { id: 'INV-2025-004', restaurant: 'Himalayan Kitchen', amount: 45000, method: 'eSewa', status: 'overdue', date: '2025-01-10' },
  { id: 'INV-2025-005', restaurant: 'Newari Delights', amount: 15000, method: 'Fonepay', status: 'pending', date: '2025-01-08' },
  { id: 'INV-2025-006', restaurant: 'Dhulikhel Traditional', amount: 45000, method: 'Khalti', status: 'pending', date: '2025-01-05' },
  { id: 'INV-2025-007', restaurant: 'Chitwan Wildlife Cafe', amount: 45000, method: 'Bank', status: 'paid', date: '2025-01-03' },
  { id: 'INV-2025-008', restaurant: 'Ilam Coffee & Kitchen', amount: 15000, method: 'eSewa', status: 'overdue', date: '2024-12-28' },
  { id: 'INV-2025-009', restaurant: 'Nuwakot Dining', amount: 15000, method: 'Bank', status: 'overdue', date: '2024-12-20' },
  { id: 'INV-2025-010', restaurant: 'Sagarmatha Palace', amount: 15000, method: 'Fonepay', status: 'paid', date: '2025-01-16' },
];

interface PromoCode {
  id: number;
  code: string;
  discount: number;
  type: 'fixed' | 'percentage';
  usage: number;
  usageLimit: number;
  expiry: string;
  active: boolean;
}

const promoCodes: PromoCode[] = [
  { id: 1, code: 'WELCOME20', discount: 20, type: 'percentage', usage: 145, usageLimit: 200, expiry: '2025-03-01', active: true },
  { id: 2, code: 'FESTIVE15', discount: 15, type: 'percentage', usage: 89, usageLimit: 150, expiry: '2025-02-15', active: true },
  { id: 3, code: 'FLAT1000', discount: 1000, type: 'fixed', usage: 34, usageLimit: 50, expiry: '2025-04-01', active: true },
  { id: 4, code: 'ENTERPRISE', discount: 25000, type: 'fixed', usage: 8, usageLimit: 20, expiry: '2025-06-01', active: true },
  { id: 5, code: 'NEWYEAR25', discount: 25, type: 'percentage', usage: 210, usageLimit: 200, expiry: '2025-01-15', active: false },
  { id: 6, code: 'TRIAL50', discount: 50, type: 'percentage', usage: 5, usageLimit: 100, expiry: '2025-05-01', active: true },
];

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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    pending: 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
    failed: 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30',
    overdue: 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30',
    active: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    inactive: 'bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30',
  };
  return <Badge className={`border capitalize ${colors[status] || colors.pending}`}>{status}</Badge>;
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    Enterprise: 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
    Pro: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    Basic: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30',
    Free: 'bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30',
  };
  return <Badge className={`border ${colors[plan] || colors.Free}`}>{plan}</Badge>;
}

export default function AdminSubscriptions() {
  const [promoSearch, setPromoSearch] = useState('');

  const filteredPromos = promoCodes.filter((p) =>
    p.code.toLowerCase().includes(promoSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription & Billing</h1>
          <p className="text-sm text-[#768B80] mt-1">Manage subscriptions, invoices, and promotional codes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[#12B877]/30 text-[#12B877] bg-[#12B877]/5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#12B877] mr-1.5 animate-pulse" />
            Auto-billing active
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.title} card={card} />
        ))}
      </div>

      {/* MRR Trend Chart */}
      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-white">MRR Trend</CardTitle>
            <p className="text-xs text-[#768B80] mt-0.5">Monthly recurring revenue over the last 12 months</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#12B877]" />
            <span className="text-[10px] text-[#768B80]">Revenue</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mrrTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12B877" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#12B877" stopOpacity={0} />
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
              <Area type="monotone" dataKey="revenue" stroke="#12B877" fill="url(#mrrGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Upcoming Renewals */}
      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-white">Upcoming Renewals</CardTitle>
            <p className="text-xs text-[#768B80] mt-0.5">Restaurants with renewals due in the next 30 days</p>
          </div>
          <Button variant="outline" size="sm" className="border-[#25332B] text-[#12B877] hover:text-white">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Process All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Amount</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Renewal Date</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-center">Days Left</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingRenewals.map((r) => (
                <TableRow key={r.id} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell>
                    <p className="text-sm font-medium text-white">{r.restaurant}</p>
                  </TableCell>
                  <TableCell><PlanBadge plan={r.plan} /></TableCell>
                  <TableCell className="text-right text-white/70 text-sm">{formatCurrency(r.amount)}</TableCell>
                  <TableCell className="text-xs text-[#768B80]">{formatDate(r.renewalDate)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-medium ${
                      r.daysLeft <= 0 ? 'text-[#DB3A3A]' : r.daysLeft <= 5 ? 'text-[#F4B740]' : 'text-[#12B877]'
                    }`}>
                      {r.daysLeft <= 0 ? 'Overdue' : `${r.daysLeft}d`}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === 'failed' && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-[#DB3A3A] hover:text-white hover:bg-[#DB3A3A]/10">
                          <RefreshCw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-[#12B877] hover:text-white">
                        <Mail className="h-3 w-3 mr-1" /> Remind
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Failed Payments */}
      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card border-l-2 border-l-[#DB3A3A]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#DB3A3A]" />
            <div>
              <CardTitle className="text-sm font-medium text-white">Failed Payments</CardTitle>
              <p className="text-xs text-[#768B80] mt-0.5">{failedPayments.length} payments require attention</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-[#25332B] text-[#DB3A3A] hover:text-white">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Amount</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-center">Days Overdue</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedPayments.map((p) => (
                <TableRow key={p.id} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-white">{p.restaurant}</p>
                      <p className="text-xs text-[#768B80]">{p.method}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-white/70 text-sm">{p.amount > 0 ? formatCurrency(p.amount) : 'Free trial'}</TableCell>
                  <TableCell className="text-xs text-[#768B80]">{formatDate(p.date)}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium text-[#DB3A3A]">{p.daysOverdue}d</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-8 text-xs border-[#25332B] text-[#12B877] hover:bg-[#12B877]/10">
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry Payment
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Management */}
      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-white">Invoice Management</CardTitle>
            <p className="text-xs text-[#768B80] mt-0.5">View and manage all platform invoices</p>
          </div>
          <Button size="sm" className="bg-[#12B877] hover:bg-[#0E945E] text-white text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-[#1A231E] border border-[#25332B] h-8 mb-4">
              <TabsTrigger value="all" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">All</TabsTrigger>
              <TabsTrigger value="paid" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">Paid</TabsTrigger>
              <TabsTrigger value="pending" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">Pending</TabsTrigger>
              <TabsTrigger value="overdue" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">Overdue</TabsTrigger>
            </TabsList>
            {['all', 'paid', 'pending', 'overdue'].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#25332B] hover:bg-transparent">
                      <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Invoice#</TableHead>
                      <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                      <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Amount</TableHead>
                      <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Method</TableHead>
                      <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices
                      .filter((inv) => tab === 'all' || inv.status === tab)
                      .map((inv) => (
                        <TableRow key={inv.id} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                          <TableCell className="text-sm text-white/70 font-mono">{inv.id}</TableCell>
                          <TableCell className="text-sm font-medium text-white">{inv.restaurant}</TableCell>
                          <TableCell className="text-right text-white/70 text-sm">{formatCurrency(inv.amount)}</TableCell>
                          <TableCell className="text-xs text-[#768B80]">{inv.method}</TableCell>
                          <TableCell><StatusBadge status={inv.status} /></TableCell>
                          <TableCell className="text-xs text-[#768B80]">{formatDate(inv.date)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Promo Code Management */}
      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-white">Promo Code Management</CardTitle>
            <p className="text-xs text-[#768B80] mt-0.5">Create and manage discount codes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#768B80]" />
              <Input
                placeholder="Search codes..."
                value={promoSearch}
                onChange={(e) => setPromoSearch(e.target.value)}
                className="pl-9 bg-[#1A231E] border-[#25332B] text-white placeholder:text-[#768B80] text-xs h-9 w-48"
              />
            </div>
            <Button size="sm" className="bg-[#12B877] hover:bg-[#0E945E] text-white text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Code
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Code</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Discount</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-center">Usage</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Expiry</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromos.map((p) => (
                <TableRow key={p.id} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell>
                    <span className="text-sm font-mono font-medium text-[#12B877]">{p.code}</span>
                  </TableCell>
                  <TableCell className="text-right text-white/70 text-sm">
                    {p.type === 'percentage' ? `${p.discount}%` : formatCurrency(p.discount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border text-[10px] ${
                      p.type === 'percentage'
                        ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'
                        : 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30'
                    }`}>
                      {p.type === 'percentage' ? (
                        <Percent className="h-2.5 w-2.5 mr-1" />
                      ) : (
                        <Hash className="h-2.5 w-2.5 mr-1" />
                      )}
                      {p.type === 'percentage' ? 'Percentage' : 'Fixed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-[#1A231E] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#12B877]"
                          style={{ width: `${(p.usage / p.usageLimit) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#768B80]">{p.usage}/{p.usageLimit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[#768B80]">{formatDate(p.expiry)}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.active ? 'active' : 'inactive'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
