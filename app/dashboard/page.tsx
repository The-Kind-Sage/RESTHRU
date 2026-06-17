'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShoppingBag,
  LayoutGrid,
  Clock,
  ArrowRight,
  Dot,
  AlertCircle,
  UserPlus,
  X,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/format';
import { getGreeting } from '@/lib/helpers';
import { useAuthStore } from '@/store/auth-store';

// Animation variants for section entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// ============================================================================
// 1. GREETING BANNER
// ============================================================================
function GreetingBanner() {
  const { user } = useAuthStore();
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-gradient-to-r from-primary-light to-primary-light border-primary/20">
        <CardContent className="p-8 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {getGreeting()}, {user?.firstName || 'Ramesh'}! ☀️
            </h1>
            <p className="text-muted-foreground text-lg">
              Your restaurant has served 47 customers today.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Revenue Today</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(24500)}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// 2. KPI CARDS ROW
// ============================================================================
function KPICard({
  icon: Icon,
  title,
  value,
  change,
  changeColor,
  subtext,
  pulse = false,
}: {
  icon: React.ComponentType<any>;
  title: string;
  value: string | number;
  change: string;
  changeColor: string;
  subtext?: string;
  pulse?: boolean;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {title}
              </p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                pulse
                  ? 'bg-destructive/10 animate-pulse'
                  : 'bg-muted'
              }`}
            >
              <Icon className={`w-6 h-6 ${
                title.includes('Revenue') ? 'text-success' :
                title.includes('Orders') ? 'text-primary' :
                title.includes('Tables') ? 'text-accent' :
                'text-destructive'
              }`} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${changeColor}`}>
              {change}
            </span>
            {subtext && (
              <span className="text-xs text-muted-foreground">{subtext}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KPISection() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <KPICard
        icon={TrendingUp}
        title="Today's Revenue"
        value={formatCurrency(24500)}
        change="↑ 12% vs yesterday"
        changeColor="text-success"
      />
      <KPICard
        icon={ShoppingBag}
        title="Total Orders"
        value="47"
        change="8 more than yesterday"
        changeColor="text-primary"
      />
      <KPICard
        icon={LayoutGrid}
        title="Active Tables"
        value="8/20"
        change="8 occupied, 12 available"
        changeColor="text-accent"
        subtext="2 reserved"
      />
      <KPICard
        icon={Clock}
        title="Pending Orders"
        value="5"
        change="In kitchen right now"
        changeColor="text-destructive"
        pulse={true}
      />
    </motion.div>
  );
}

// ============================================================================
// 3. TABLE MAP PREVIEW
// ============================================================================
function TableMapPreview() {
  // Mock table data: status can be 'available', 'occupied', 'bill', 'reserved'
  const tables = [
    'available', 'occupied', 'available', 'occupied', 'available',
    'occupied', 'available', 'available', 'bill', 'occupied',
    'available', 'occupied', 'available', 'available', 'reserved',
    'occupied', 'available', 'available', 'occupied', 'available',
  ];

  const getTableColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-destructive';
      case 'available':
        return 'bg-success';
      case 'bill':
        return 'bg-accent';
      case 'reserved':
        return 'bg-muted-foreground';
      default:
        return 'bg-muted';
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Table Overview</CardTitle>
            <Link
              href="/dashboard/tables"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View Full Map
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 mb-6">
            {tables.map((status, idx) => (
              <div
                key={idx}
                className={`aspect-square rounded-lg ${getTableColor(status)}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground border-t pt-4">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-sm"></div>
              8 Occupied
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success rounded-sm"></div>
              12 Available
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-sm"></div>
              2 Bill Requested
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// 4. LIVE ORDERS FEED
// ============================================================================
interface Order {
  id: string;
  tableNumber: number;
  items: number;
  amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  time: Date;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-0047',
    tableNumber: 5,
    items: 4,
    amount: 1200,
    status: 'pending',
    time: new Date(Date.now() - 14 * 60000),
  },
  {
    id: 'ORD-0046',
    tableNumber: 12,
    items: 3,
    amount: 950,
    status: 'preparing',
    time: new Date(Date.now() - 8 * 60000),
  },
  {
    id: 'ORD-0045',
    tableNumber: 8,
    items: 5,
    amount: 1800,
    status: 'ready',
    time: new Date(Date.now() - 20 * 60000),
  },
  {
    id: 'ORD-0044',
    tableNumber: 3,
    items: 2,
    amount: 650,
    status: 'served',
    time: new Date(Date.now() - 35 * 60000),
  },
  {
    id: 'ORD-0043',
    tableNumber: 15,
    items: 4,
    amount: 1450,
    status: 'preparing',
    time: new Date(Date.now() - 45 * 60000),
  },
];

function getOrderStatusColor(
  status: string
): { bg: string; text: string } {
  switch (status) {
    case 'pending':
      return { bg: 'bg-accent-light', text: 'text-warning' };
    case 'preparing':
      return { bg: 'bg-info/10', text: 'text-info' };
    case 'ready':
      return { bg: 'bg-primary-light', text: 'text-primary' };
    case 'served':
      return { bg: 'bg-muted', text: 'text-muted-foreground' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground' };
  }
}

function LiveOrdersFeed() {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Live Orders</CardTitle>
            <Link
              href="/dashboard/orders"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockOrders.map((order) => {
            const statusColor = getOrderStatusColor(order.status);
            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border hover:border-border transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {order.id} • Table {order.tableNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(order.time)} • {order.items} items
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(order.amount)}
                    </p>
                  </div>
                  <Badge
                    className={`whitespace-nowrap text-xs ${statusColor.bg} ${statusColor.text}`}
                    variant="outline"
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// 5. REVENUE CHART
// ============================================================================
const chartData = [
  { day: 'Mon', revenue: 18000 },
  { day: 'Tue', revenue: 22000 },
  { day: 'Wed', revenue: 19000 },
  { day: 'Thu', revenue: 24500 },
  { day: 'Fri', revenue: 28000 },
  { day: 'Sat', revenue: 32000 },
  { day: 'Sun', revenue: 15000 },
];

function RevenueChart() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Revenue This Week</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  period === 'week'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  period === 'month'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted'
                }`}
              >
                This Month
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${formatNumber(value / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => formatCurrency(value as number)}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// 6. TOP SELLING ITEMS
// ============================================================================
interface MenuItem {
  name: string;
  orders: number;
  revenue: number;
  percentage: number;
  isVeg: boolean;
}

const topItems: MenuItem[] = [
  { name: 'Chicken Mo:Mo', orders: 23, revenue: 10350, percentage: 100, isVeg: false },
  { name: 'Thakali Set', orders: 18, revenue: 9000, percentage: 78, isVeg: false },
  { name: 'Masala Tea', orders: 15, revenue: 750, percentage: 65, isVeg: true },
  { name: 'Veg Mo:Mo', orders: 12, revenue: 5400, percentage: 52, isVeg: true },
  { name: 'Newari Khaja Set', orders: 9, revenue: 4050, percentage: 39, isVeg: false },
];

function TopSellingItems() {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader>
          <CardTitle>Top Items Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topItems.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.isVeg ? 'bg-success' : 'bg-destructive'
                    }`}
                  />
                  <span className="text-sm font-medium text-foreground flex-1">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.orders} orders
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground ml-2">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// 7. RECENT ACTIVITY FEED
// ============================================================================
interface Activity {
  id: string;
  type: 'order' | 'payment' | 'alert' | 'cancelled' | 'staff';
  title: string;
  time: Date;
}

const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'order',
    title: 'Table 3 order placed',
    time: new Date(Date.now() - 2 * 60000),
  },
  {
    id: '2',
    type: 'payment',
    title: 'Table 7 bill paid - NPR 3,400',
    time: new Date(Date.now() - 5 * 60000),
  },
  {
    id: '3',
    type: 'alert',
    title: 'Low stock alert: Chicken',
    time: new Date(Date.now() - 10 * 60000),
  },
  {
    id: '4',
    type: 'cancelled',
    title: 'Order #045 cancelled',
    time: new Date(Date.now() - 15 * 60000),
  },
  {
    id: '5',
    type: 'staff',
    title: 'New staff Sita added',
    time: new Date(Date.now() - 30 * 60000),
  },
];

function getActivityDotColor(type: string): string {
  switch (type) {
    case 'order':
      return 'bg-success';
    case 'payment':
      return 'bg-info';
    case 'alert':
      return 'bg-accent';
    case 'cancelled':
      return 'bg-destructive';
    case 'staff':
      return 'bg-success';
    default:
      return 'bg-muted-foreground';
  }
}

function RecentActivityFeed() {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4 items-start">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${getActivityDotColor(
                    activity.type
                  )}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================
export default function DashboardPage() {
  return (
    <motion.div
      className="space-y-6 pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Greeting Banner */}
      <GreetingBanner />

      {/* KPI Cards */}
      <KPISection />

      {/* Main Grid Layout: 3 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Revenue Chart and Top Items */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <RevenueChart />
          <TopSellingItems />
        </motion.div>

        {/* Right Column: Table Map, Orders, and Activity */}
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <TableMapPreview />
        </motion.div>
      </div>

      {/* Bottom Row: Orders and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveOrdersFeed />
        <RecentActivityFeed />
      </div>
    </motion.div>
  );
}
