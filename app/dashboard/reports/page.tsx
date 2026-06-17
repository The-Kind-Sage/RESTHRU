'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Star,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

// Chart and table data — will be populated from real DB queries
const revenueData: { date: string; revenue: number; lastRevenue: number }[] = [];
const hourlyData: { hour: string; orders: number; revenue: number }[] = [];
const paymentData: { name: string; value: number; color: string }[] = [];
const topItems: { rank: number; name: string; category: string; orders: number; revenue: number; trend: string }[] = [];
const leastItems: { rank: number; name: string; category: string; orders: number; revenue: number }[] = [];
const categoryData: { name: string; value: number }[] = [];
const categoryColors: string[] = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const staffData: { name: string; ordersHandled: number; revenue: number; avgOrderValue: number; rating: number }[] = [];
const monthlyVATData: { month: string; taxable: number; vat: number }[] = [];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('month');
  const [nepaliDate, setNepaliDate] = useState(false);
  const [revenueView, setRevenueView] = useState('daily');
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Track your restaurant performance and metrics
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Button
            variant={dateRange === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('today')}
          >
            Today
          </Button>
          <Button
            variant={dateRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('week')}
          >
            This Week
          </Button>
          <Button
            variant={dateRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('month')}
          >
            This Month
          </Button>
          <Button variant="outline" size="sm">
            Custom
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="nepali-date" className="text-sm">
            Nepali Date
          </Label>
          <Switch
            id="nepali-date"
            checked={nepaliDate}
            onCheckedChange={setNepaliDate}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="tax">Tax & VAT</TabsTrigger>
        </TabsList>

        {/* SALES TAB */}
        <TabsContent value="sales" className="space-y-6">
          {/* KPI Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary-light to-primary-light">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NPR 0</div>
                <p className="text-xs text-muted-foreground mt-1">No data yet</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary-light to-emerald-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">No data yet</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-accent-light to-accent-light">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NPR 0</div>
                <p className="text-xs text-muted-foreground mt-1">No data yet</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-destructive/10 to-destructive/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground mt-1">No data yet</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Daily revenue for the selected period</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={revenueView === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenueView('daily')}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={revenueView === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenueView('weekly')}
                  >
                    Weekly
                  </Button>
                  <Button
                    variant={revenueView === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRevenueView('monthly')}
                  >
                    Monthly
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Label htmlFor="comparison" className="text-sm">
                  vs Last Period
                </Label>
                <Switch
                  id="comparison"
                  checked={showComparison}
                  onCheckedChange={setShowComparison}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  {showComparison && (
                    <Line
                      type="monotone"
                      dataKey="lastRevenue"
                      stroke="#9ca3af"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Hour */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Hour</CardTitle>
              <CardDescription>Busiest hours throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                    {hourlyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.revenue > 25000 ? '#f59e0b' : '#4f46e5'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Distribution of payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {paymentData.map((method) => (
                    <div key={method.name} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: method.color }}
                      />
                      <span className="text-sm">
                        {method.name}: {method.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ITEMS TAB */}
        <TabsContent value="items" className="space-y-6">
          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
              <CardDescription>Best performing menu items this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-muted-foreground">
                      <th className="text-left py-3 px-4 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 font-medium">Item</th>
                      <th className="text-left py-3 px-4 font-medium">Category</th>
                      <th className="text-right py-3 px-4 font-medium">Orders</th>
                      <th className="text-right py-3 px-4 font-medium">Revenue</th>
                      <th className="text-center py-3 px-4 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((item) => (
                      <tr key={item.rank} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{item.rank}</td>
                        <td className="py-3 px-4 font-medium">{item.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 text-right">{item.orders}</td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 inline text-success" />
                          ) : (
                            <TrendingDown className="h-4 w-4 inline text-destructive" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Least Selling Items */}
          <Card className="border-accent/20 bg-accent-light">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-accent flex-shrink-0" />
                <div>
                  <CardTitle className="text-base">
                    Consider removing or promoting these items
                  </CardTitle>
                  <CardDescription>
                    Low-performing items with minimal orders
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-muted-foreground">
                      <th className="text-left py-3 px-4 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 font-medium">Item</th>
                      <th className="text-left py-3 px-4 font-medium">Category</th>
                      <th className="text-right py-3 px-4 font-medium">Orders</th>
                      <th className="text-right py-3 px-4 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leastItems.map((item) => (
                      <tr key={item.rank} className="border-b">
                        <td className="py-3 px-4">{item.rank}</td>
                        <td className="py-3 px-4 font-medium">{item.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {item.category}
                        </td>
                        <td className="py-3 px-4 text-right">{item.orders}</td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} ${entry.value}%`}
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STAFF TAB */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
              <CardDescription>Individual staff member metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-muted-foreground">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-right py-3 px-4 font-medium">Orders Handled</th>
                      <th className="text-right py-3 px-4 font-medium">Revenue Generated</th>
                      <th className="text-right py-3 px-4 font-medium">Avg Order Value</th>
                      <th className="text-center py-3 px-4 font-medium">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.map((staff) => (
                      <tr key={staff.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{staff.name}</td>
                        <td className="py-3 px-4 text-right">{staff.ordersHandled}</td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(staff.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(staff.avgOrderValue)}
                        </td>
                        <td className="py-3 px-4 text-center flex items-center justify-center gap-1">
                          <span className="font-medium">{staff.rating}</span>
                          <Star className="h-4 w-4 fill-accent text-accent" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAX & VAT TAB */}
        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>IRD Compliant Report</CardTitle>
              <CardDescription>Tax and VAT summary for compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total Taxable Amount</p>
                  <p className="mt-2 text-2xl font-bold">NPR 0</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">VAT Collected (13%)</p>
                  <p className="mt-2 text-2xl font-bold text-primary">NPR 0</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Net Revenue</p>
                  <p className="mt-2 text-2xl font-bold">NPR 0</p>
                </div>
              </div>

              <Button className="w-full md:w-auto">Download IRD Format Report</Button>

              <Separator />

              {/* Monthly VAT Summary */}
              <div>
                <h3 className="font-semibold mb-4">Monthly VAT Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-muted-foreground">
                        <th className="text-left py-3 px-4 font-medium">Month</th>
                        <th className="text-right py-3 px-4 font-medium">Taxable Amount</th>
                        <th className="text-right py-3 px-4 font-medium">VAT (13%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyVATData.map((row) => (
                        <tr key={row.month} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.month}</td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(row.taxable)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(row.vat)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
