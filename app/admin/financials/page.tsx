'use client';

import React from 'react';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Server,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';

const revenueKpis = [
  { title: 'Platform Revenue', value: 'NPR 18,45,000', icon: Wallet, trend: '+22.4% MoM', trendUp: true },
  { title: 'Transaction Fees', value: 'NPR 2,35,000', icon: TrendingUp, trend: '+18.2% MoM', trendUp: true },
  { title: 'Payment Costs', value: 'NPR 1,12,000', icon: CreditCard, trend: '+5.3% MoM', trendUp: false },
  { title: 'Hosting', value: 'NPR 48,000', icon: Server, trend: 'Flat', trendUp: true },
  { title: 'Profit Margin', value: '62%', icon: BarChart3, trend: '+4.1% improvement', trendUp: true },
];

const revenueChartData = [
  { month: 'Jan', subscription: 850000, transaction: 140000 },
  { month: 'Feb', subscription: 880000, transaction: 155000 },
  { month: 'Mar', subscription: 920000, transaction: 170000 },
  { month: 'Apr', subscription: 980000, transaction: 190000 },
  { month: 'May', subscription: 1050000, transaction: 210000 },
  { month: 'Jun', subscription: 1120000, transaction: 235000 },
];

const gatewayData = [
  { gateway: 'eSewa', transactions: 28470, volume: 9850000, fee: 1.5, totalCost: 147750 },
  { gateway: 'Khalti', transactions: 18420, volume: 6240000, fee: 1.8, totalCost: 112320 },
  { gateway: 'Fonepay', transactions: 12350, volume: 4150000, fee: 2.0, totalCost: 83000 },
];

const arAgingData = [
  { restaurant: 'Nuwakot Dining', amount: 45000, days0to30: 0, days31to60: 0, days61to90: 15000, days90plus: 30000, status: 'Critical' },
  { restaurant: 'Ilam Coffee & Kitchen', amount: 28500, days0to30: 8500, days31to60: 20000, days61to90: 0, days90plus: 0, status: 'Overdue' },
  { restaurant: 'Kathmandu Cafe', amount: 12000, days0to30: 12000, days31to60: 0, days61to90: 0, days90plus: 0, status: 'Current' },
  { restaurant: 'Rara Valley Kitchen', amount: 8000, days0to30: 8000, days31to60: 0, days61to90: 0, days90plus: 0, status: 'Current' },
  { restaurant: 'Dhulikhel Traditional', amount: 22000, days0to30: 0, days31to60: 22000, days61to90: 0, days90plus: 0, status: 'Overdue' },
];

const plData = [
  { category: 'Revenue', amount: 1845000, percentage: 100 },
  { category: 'COGS', amount: 738000, percentage: 40 },
  { category: 'Gross Profit', amount: 1107000, percentage: 60 },
  { category: 'Operating Costs', amount: 369000, percentage: 20 },
  { category: 'Net Profit', amount: 738000, percentage: 40 },
];

const unitEconomics = [
  { label: 'CAC', value: 'NPR 12,500', icon: TrendingUp, color: '#3B82F6' },
  { label: 'LTV', value: 'NPR 2,85,000', icon: Wallet, color: '#12B877' },
  { label: 'LTV:CAC Ratio', value: '22.8x', icon: BarChart3, color: '#F4B740' },
  { label: 'Payback Period', value: '5.2 months', icon: Clock, color: '#12B877' },
];

const ArStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Current: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    Overdue: 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
    Critical: 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30',
  };
  return <Badge className={`border ${colors[status] || ''}`}>{status}</Badge>;
};

export default function AdminFinancials() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Management</h1>
          <p className="text-sm text-[#768B80] mt-1">Revenue, payment gateways, AR aging & unit economics</p>
        </div>
        <Button variant="outline" size="sm" className="border-[#25332B] text-[#12B877] hover:bg-[#12B877]/10">
          <Wallet className="h-4 w-4 mr-1.5" /> Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {revenueKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-medium text-[#768B80] uppercase tracking-wider">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-[#12B877]/60" strokeWidth={1.5} />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-white tracking-tight">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trendUp ? (
                    <ArrowUpRight className="h-3 w-3 text-[#12B877]" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-[#DB3A3A]" />
                  )}
                  <span className={`text-[10px] ${kpi.trendUp ? 'text-[#12B877]' : 'text-[#DB3A3A]'}`}>{kpi.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-white">Revenue Breakdown</CardTitle>
              <p className="text-xs text-[#768B80] mt-0.5">Subscription revenue vs transaction fees — last 6 months</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#12B877]" />
                <span className="text-[10px] text-[#768B80]">Subscription</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                <span className="text-[10px] text-[#768B80]">Transaction Fees</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12B877" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#12B877" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="txnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
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
              <Area type="monotone" dataKey="subscription" stroke="#12B877" fill="url(#subGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="transaction" stroke="#3B82F6" fill="url(#txnGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#12B877]" />
              <CardTitle className="text-sm font-medium text-white">Payment Gateway Costs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#25332B] hover:bg-transparent">
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Gateway</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Transactions</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Volume</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Fee %</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gatewayData.map((row) => (
                  <TableRow key={row.gateway} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                    <TableCell><span className="text-sm font-medium text-white">{row.gateway}</span></TableCell>
                    <TableCell className="text-right text-white/70 text-sm">{formatNumber(row.transactions)}</TableCell>
                    <TableCell className="text-right text-white/70 text-sm">{formatCurrency(row.volume)}</TableCell>
                    <TableCell className="text-right text-white/70 text-sm">{row.fee}%</TableCell>
                    <TableCell className="text-right text-white/70 text-sm">{formatCurrency(row.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#F4B740]" />
              <CardTitle className="text-sm font-medium text-white">AR Aging</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#25332B] hover:bg-transparent">
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">0–30</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">31–60</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">61–90</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">90+</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arAgingData.map((row) => (
                  <TableRow key={row.restaurant} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                    <TableCell><span className="text-sm font-medium text-white">{row.restaurant}</span></TableCell>
                    <TableCell className="text-right text-white/70 text-sm">{formatCurrency(row.amount)}</TableCell>
                    <TableCell className="text-right text-white/70 text-sm">{formatCurrency(row.days0to30)}</TableCell>
                    <TableCell className="text-right text-white/70 text-sm">{formatCurrency(row.days31to60)}</TableCell>
                    <TableCell className="text-right text-white/70 text-sm">{formatCurrency(row.days61to90)}</TableCell>
                    <TableCell className="text-right text-white/70 text-sm">{formatCurrency(row.days90plus)}</TableCell>
                    <TableCell><ArStatusBadge status={row.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#12B877]" />
              <CardTitle className="text-sm font-medium text-white">P&L Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#25332B] hover:bg-transparent">
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Category</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Amount</TableHead>
                  <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">% of Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plData.map((row) => {
                  const isTotal = row.category === 'Revenue' || row.category === 'Gross Profit' || row.category === 'Net Profit';
                  return (
                    <TableRow key={row.category} className={`border-[#25332B] hover:bg-[#1A231E]/50 transition-colors ${isTotal ? 'bg-[#1A231E]/30' : ''}`}>
                      <TableCell>
                        <span className={`text-sm ${isTotal ? 'font-bold text-white' : 'text-white/70'}`}>{row.category}</span>
                      </TableCell>
                      <TableCell className="text-right text-white/70 text-sm">{formatCurrency(row.amount)}</TableCell>
                      <TableCell className="text-right text-white/70 text-sm">{row.percentage}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#12B877]" />
              <CardTitle className="text-sm font-medium text-white">Unit Economics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {unitEconomics.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                        <Icon className="h-4 w-4" style={{ color: item.color }} />
                      </div>
                    </div>
                    <p className="text-[11px] text-[#768B80] uppercase tracking-wider">{item.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
