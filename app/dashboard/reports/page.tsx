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

// Mock data for revenue chart
const revenueData = [
  { date: 'Jun 1', revenue: 32000, lastRevenue: 28000 },
  { date: 'Jun 2', revenue: 38000, lastRevenue: 35000 },
  { date: 'Jun 3', revenue: 35000, lastRevenue: 32000 },
  { date: 'Jun 4', revenue: 42000, lastRevenue: 40000 },
  { date: 'Jun 5', revenue: 45000, lastRevenue: 42000 },
  { date: 'Jun 6', revenue: 48000, lastRevenue: 45000 },
  { date: 'Jun 7', revenue: 52000, lastRevenue: 48000 },
  { date: 'Jun 8', revenue: 38000, lastRevenue: 35000 },
  { date: 'Jun 9', revenue: 41000, lastRevenue: 38000 },
  { date: 'Jun 10', revenue: 45000, lastRevenue: 42000 },
  { date: 'Jun 11', revenue: 48000, lastRevenue: 45000 },
  { date: 'Jun 12', revenue: 52000, lastRevenue: 48000 },
  { date: 'Jun 13', revenue: 55000, lastRevenue: 51000 },
  { date: 'Jun 14', revenue: 58000, lastRevenue: 54000 },
];

// Mock hourly data
const hourlyData = [
  { hour: '6 AM', orders: 12, revenue: 4800 },
  { hour: '7 AM', orders: 28, revenue: 11200 },
  { hour: '8 AM', orders: 42, revenue: 16800 },
  { hour: '9 AM', orders: 38, revenue: 15200 },
  { hour: '10 AM', orders: 35, revenue: 14000 },
  { hour: '11 AM', orders: 52, revenue: 20800 },
  { hour: '12 PM', orders: 68, revenue: 27200 },
  { hour: '1 PM', orders: 62, revenue: 24800 },
  { hour: '2 PM', orders: 48, revenue: 19200 },
  { hour: '3 PM', orders: 35, revenue: 14000 },
  { hour: '4 PM', orders: 42, revenue: 16800 },
  { hour: '5 PM', orders: 55, revenue: 22000 },
  { hour: '6 PM', orders: 75, revenue: 30000 },
  { hour: '7 PM', orders: 82, revenue: 32800 },
  { hour: '8 PM', orders: 78, revenue: 31200 },
  { hour: '9 PM', orders: 65, revenue: 26000 },
  { hour: '10 PM', orders: 38, revenue: 15200 },
];

// Payment methods pie data
const paymentData = [
  { name: 'Cash', value: 64, color: '#e11d48' },
  { name: 'eSewa', value: 18, color: '#06b6d4' },
  { name: 'Khalti', value: 12, color: '#8b5cf6' },
  { name: 'Fonepay', value: 6, color: '#f59e0b' },
];

// Top selling items
const topItems = [
  {
    rank: 1,
    name: 'Chicken Momo',
    category: 'Starters',
    orders: 284,
    revenue: 42600,
    trend: 'up',
  },
  {
    rank: 2,
    name: 'Chow Mein',
    category: 'Main Course',
    orders: 256,
    revenue: 38400,
    trend: 'up',
  },
  {
    rank: 3,
    name: 'Masala Tea',
    category: 'Drinks',
    orders: 198,
    revenue: 3960,
    trend: 'up',
  },
  {
    rank: 4,
    name: 'Butter Chicken',
    category: 'Main Course',
    orders: 168,
    revenue: 33600,
    trend: 'down',
  },
  {
    rank: 5,
    name: 'Samosa',
    category: 'Starters',
    orders: 145,
    revenue: 2175,
    trend: 'up',
  },
  {
    rank: 6,
    name: 'Fried Rice',
    category: 'Main Course',
    orders: 134,
    revenue: 20100,
    trend: 'up',
  },
  {
    rank: 7,
    name: 'Gulab Jamun',
    category: 'Desserts',
    orders: 98,
    revenue: 2450,
    trend: 'down',
  },
  {
    rank: 8,
    name: 'Coke',
    category: 'Drinks',
    orders: 156,
    revenue: 3900,
    trend: 'up',
  },
  {
    rank: 9,
    name: 'Paneer Tikka',
    category: 'Starters',
    orders: 89,
    revenue: 8900,
    trend: 'down',
  },
  {
    rank: 10,
    name: 'Dal Bhat',
    category: 'Main Course',
    orders: 76,
    revenue: 7600,
    trend: 'up',
  },
];

// Least selling items
const leastItems = [
  { rank: 1, name: 'Truffle Pasta', category: 'Specials', orders: 8, revenue: 1600 },
  { rank: 2, name: 'Biryani', category: 'Main Course', orders: 12, revenue: 3600 },
  { rank: 3, name: 'Kheer', category: 'Desserts', orders: 5, revenue: 500 },
];

// Category performance
const categoryData = [
  { name: 'Main Course', value: 45 },
  { name: 'Starters', value: 20 },
  { name: 'Drinks', value: 18 },
  { name: 'Desserts', value: 12 },
  { name: 'Specials', value: 5 },
];

const categoryColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Staff performance
const staffData = [
  {
    name: 'Ram Kumar',
    ordersHandled: 284,
    revenue: 56800,
    avgOrderValue: 200,
    rating: 4.8,
  },
  {
    name: 'Priya Singh',
    ordersHandled: 256,
    revenue: 51200,
    avgOrderValue: 200,
    rating: 4.6,
  },
  {
    name: 'Arun Pradhan',
    ordersHandled: 215,
    revenue: 43000,
    avgOrderValue: 200,
    rating: 4.5,
  },
  {
    name: 'Neha Sharma',
    ordersHandled: 198,
    revenue: 39600,
    avgOrderValue: 200,
    rating: 4.9,
  },
  {
    name: 'Suresh Thapa',
    ordersHandled: 167,
    revenue: 33400,
    avgOrderValue: 200,
    rating: 4.3,
  },
];

// Monthly VAT summary
const monthlyVATData = [
  { month: 'Jan', taxable: 385000, vat: 50050 },
  { month: 'Feb', taxable: 392000, vat: 50960 },
  { month: 'Mar', taxable: 410000, vat: 53300 },
  { month: 'Apr', taxable: 418000, vat: 54340 },
  { month: 'May', taxable: 425000, vat: 55250 },
  { month: 'Jun', taxable: 428319, vat: 55681 },
];

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
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NPR 4,85,000</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +8.3% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NPR 389</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +3.8% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Cash 64%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Preferred method
                </p>
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
                            <TrendingUp className="h-4 w-4 inline text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 inline text-red-500" />
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
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-amber-500 flex-shrink-0" />
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
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
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
                  <p className="mt-2 text-2xl font-bold">NPR 4,28,319</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">VAT Collected (13%)</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">NPR 55,681</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Net Revenue</p>
                  <p className="mt-2 text-2xl font-bold">NPR 4,85,000</p>
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
