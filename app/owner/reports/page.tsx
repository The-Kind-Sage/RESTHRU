'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import {
  getSalesReport,
  getItemReport,
  getStaffReport,
  getTaxReport,
} from '@/lib/actions/reports';
import { toast } from 'sonner';

const categoryColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export default function ReportsPage() {
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;

  const [dateRange, setDateRange] = useState('month');
  const [nepaliDate, setNepaliDate] = useState(false);
  const [revenueView, setRevenueView] = useState('daily');
  const [showComparison, setShowComparison] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(true);

  // Data state
  const [salesData, setSalesData] = useState<any>(null);
  const [itemData, setItemData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [taxData, setTaxData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [sales, items, staff, tax] = await Promise.all([
        getSalesReport(restaurantId, dateRange),
        getItemReport(restaurantId, dateRange),
        getStaffReport(restaurantId, dateRange),
        getTaxReport(restaurantId, dateRange),
      ]);

      if (sales.data) setSalesData(sales.data);
      if (items.data) setItemData(items.data);
      if (staff.data) setStaffData(staff.data);
      if (tax.data) setTaxData(tax.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sd = salesData || {
    totalRevenue: 0, totalOrders: 0, totalDiscount: 0, totalTax: 0,
    averageOrderValue: 0, paymentMethodBreakdown: [], orderTypeBreakdown: [],
    topSellingItems: [], hourlyData: [], revenueData: [],
  };

  const id = itemData || { topItems: [], leastItems: [], categoryData: [] };
  const std = staffData || [];
  const td = taxData || { totalTaxable: 0, totalVAT: 0, netRevenue: 0, monthlyVATData: [] };

  const handleExport = () => {
    const csvRows: string[] = [];
    csvRows.push('Report,Value');
    csvRows.push(`Total Revenue,${sd.totalRevenue}`);
    csvRows.push(`Total Orders,${sd.totalOrders}`);
    csvRows.push(`Avg Order Value,${sd.averageOrderValue}`);
    csvRows.push(`Total Tax,${sd.totalTax}`);
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report-${dateRange}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const handleDownloadIRD = () => {
    const csvRows: string[] = [];
    csvRows.push('Month,Taxable Amount,VAT');
    for (const row of td.monthlyVATData) {
      csvRows.push(`${row.month},${row.taxable},${row.vat}`);
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ird-report-${dateRange}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('IRD report downloaded');
  };

  const topPayment = sd.paymentMethodBreakdown?.[0]?.name || '\u2014';

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
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
            <ChevronDown className="h-4 w-4" />
          </Button>
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
          <Button variant="outline" size="sm" onClick={() => setDateRange('year')}>
            This Year
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                <div className="text-2xl font-bold">{formatCurrency(sd.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {sd.totalOrders > 0 ? `${sd.totalOrders} orders` : 'No data yet'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary-light to-emerald-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sd.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {sd.totalOrders > 0 ? `${formatCurrency(sd.totalRevenue / sd.totalOrders)} avg` : 'No data yet'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-accent-light to-accent-light">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(sd.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Discount: {formatCurrency(sd.totalDiscount)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-destructive/10 to-destructive/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topPayment}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tax: {formatCurrency(sd.totalTax)}
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
              {sd.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={sd.revenueData}>
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
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                  No revenue data for this period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Hour */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Hour</CardTitle>
              <CardDescription>Busiest hours throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              {sd.hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sd.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                      {sd.hourlyData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.revenue > 25000 ? '#f59e0b' : '#4f46e5'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                  No hourly data for this period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Distribution of payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              {sd.paymentMethodBreakdown.length > 0 ? (
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sd.paymentMethodBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name} ${entry.value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sd.paymentMethodBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {sd.paymentMethodBreakdown.map((method: any) => (
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
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                  No payment data for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ITEMS TAB */}
        <TabsContent value="items" className="space-y-6">
          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
              <CardDescription>Best performing menu items this period</CardDescription>
            </CardHeader>
            <CardContent>
              {id.topItems.length > 0 ? (
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
                      {id.topItems.map((item: any) => (
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
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">No item data for this period</div>
              )}
            </CardContent>
          </Card>

          {/* Least Selling Items */}
          {id.leastItems.length > 0 && (
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
                      {id.leastItems.map((item: any) => (
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
          )}

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              {id.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={id.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name} ${entry.value}%`}
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {id.categoryData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                  No category data for this period
                </div>
              )}
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
              {std.length > 0 ? (
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
                      {std.map((staff: any) => (
                        <tr key={staff.name} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{staff.name}</td>
                          <td className="py-3 px-4 text-right">{staff.ordersHandled}</td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(staff.revenue)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(staff.avgOrderValue)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-medium">{staff.rating}</span>
                            <Star className="h-4 w-4 fill-accent text-accent inline ml-1" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">No staff data for this period</div>
              )}
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
                  <p className="mt-2 text-2xl font-bold">{formatCurrency(td.totalTaxable)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Tax Collected</p>
                  <p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(td.totalVAT)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Net Revenue</p>
                  <p className="mt-2 text-2xl font-bold">{formatCurrency(td.netRevenue)}</p>
                </div>
              </div>

              <Button className="w-full md:w-auto" onClick={handleDownloadIRD} disabled={td.monthlyVATData.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Download IRD Format Report
              </Button>

              <Separator />

              {/* Monthly VAT Summary */}
              <div>
                <h3 className="font-semibold mb-4">Monthly Tax Summary</h3>
                {td.monthlyVATData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="text-muted-foreground">
                          <th className="text-left py-3 px-4 font-medium">Month</th>
                          <th className="text-right py-3 px-4 font-medium">Taxable Amount</th>
                          <th className="text-right py-3 px-4 font-medium">Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {td.monthlyVATData.map((row: any) => (
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
                ) : (
                  <div className="py-4 text-center text-muted-foreground text-sm">No tax data for this period</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
