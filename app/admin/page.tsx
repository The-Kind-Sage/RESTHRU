'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  UserPlus,
  Eye,
  Ban,
  ArrowUpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime } from '@/lib/format';

// Mock data
const kpiCards = [
  {
    title: 'Total Restaurants',
    value: '547',
    icon: Building2,
    accentColor: 'from-purple-600 to-purple-400',
    textColor: 'text-purple-400',
  },
  {
    title: 'Active Today',
    value: '312',
    icon: Building2,
    accentColor: 'from-emerald-600 to-emerald-400',
    textColor: 'text-emerald-400',
    hasAnimation: true,
  },
  {
    title: 'Monthly Revenue (Platform)',
    value: 'NPR 12,45,000',
    icon: TrendingUp,
    accentColor: 'from-amber-600 to-amber-400',
    textColor: 'text-amber-400',
  },
  {
    title: 'New Signups This Month',
    value: '47',
    icon: UserPlus,
    accentColor: 'from-purple-600 to-purple-400',
    textColor: 'text-purple-400',
  },
];

const restaurantsMockData = [
  {
    id: 1,
    name: 'Himalayan Kitchen',
    city: 'Kathmandu',
    owner: 'Ramesh Poudel',
    plan: 'Pro',
    status: 'Active',
    tables: 24,
    revenue: 125000,
    joined: '2024-01-15',
  },
  {
    id: 2,
    name: 'Thakali House',
    city: 'Pokhara',
    owner: 'Bhim Magar',
    plan: 'Enterprise',
    status: 'Active',
    tables: 42,
    revenue: 285000,
    joined: '2023-08-20',
  },
  {
    id: 3,
    name: 'Newari Delights',
    city: 'Kathmandu',
    owner: 'Priya Shakya',
    plan: 'Basic',
    status: 'Active',
    tables: 12,
    revenue: 45000,
    joined: '2024-03-10',
  },
  {
    id: 4,
    name: 'Kathmandu Cafe',
    city: 'Kathmandu',
    owner: 'Anish Sharma',
    plan: 'Free',
    status: 'Trial',
    tables: 8,
    revenue: 15000,
    joined: '2024-06-01',
  },
  {
    id: 5,
    name: 'Pokhara Grill',
    city: 'Pokhara',
    owner: 'Deepak Ale',
    plan: 'Pro',
    status: 'Active',
    tables: 30,
    revenue: 185000,
    joined: '2023-11-05',
  },
  {
    id: 6,
    name: 'Nuwakot Dining',
    city: 'Bhaktapur',
    owner: 'Sunita Tamang',
    plan: 'Basic',
    status: 'Suspended',
    tables: 15,
    revenue: 0,
    joined: '2024-02-14',
  },
  {
    id: 7,
    name: 'Langtang Lodge',
    city: 'Kathmandu',
    owner: 'Tenzin Sherpa',
    plan: 'Enterprise',
    status: 'Active',
    tables: 50,
    revenue: 325000,
    joined: '2023-05-22',
  },
  {
    id: 8,
    name: 'Dhulikhel Traditional',
    city: 'Dhulikhel',
    owner: 'Maya Rai',
    plan: 'Pro',
    status: 'Active',
    tables: 18,
    revenue: 95000,
    joined: '2024-01-28',
  },
  {
    id: 9,
    name: 'Ilam Coffee & Kitchen',
    city: 'Ilam',
    owner: 'Harish Limbu',
    plan: 'Basic',
    status: 'Active',
    tables: 10,
    revenue: 35000,
    joined: '2024-04-16',
  },
  {
    id: 10,
    name: 'Chitwan Wildlife Cafe',
    city: 'Chitwan',
    owner: 'Govind Thapa',
    plan: 'Pro',
    status: 'Active',
    tables: 28,
    revenue: 165000,
    joined: '2023-10-08',
  },
];

const mrrData = [
  { month: 'Jan', revenue: 800000 },
  { month: 'Feb', revenue: 850000 },
  { month: 'Mar', revenue: 920000 },
  { month: 'Apr', revenue: 980000 },
  { month: 'May', revenue: 1050000 },
  { month: 'Jun', revenue: 1120000 },
  { month: 'Jul', revenue: 1245000 },
];

const subscriptionData = [
  { name: 'Free', value: 191, percentage: 35 },
  { name: 'Basic', value: 164, percentage: 30 },
  { name: 'Pro', value: 137, percentage: 25 },
  { name: 'Enterprise', value: 55, percentage: 10 },
];

const colors = ['#6b7280', '#4f46e5', '#10b981', '#f59e0b'];

const recentSignups = [
  {
    name: 'Kali Bahadur Restaurant',
    owner: 'Kali Bahadur',
    plan: 'Pro',
    time: '2 hours ago',
  },
  {
    name: 'Sagarmatha Palace',
    owner: 'Sonam Sherpa',
    plan: 'Basic',
    time: '5 hours ago',
  },
  {
    name: 'Rara Valley Kitchen',
    owner: 'Ujjwal Prasad',
    plan: 'Free',
    time: '1 day ago',
  },
  {
    name: 'Manang Heritage',
    owner: 'Pemba Dorji',
    plan: 'Enterprise',
    time: '2 days ago',
  },
  {
    name: 'Tanahu Traditions',
    owner: 'Rita Ghimire',
    plan: 'Pro',
    time: '3 days ago',
  },
];

const getPlanBadgeColor = (plan: string) => {
  switch (plan) {
    case 'Enterprise':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Pro':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'Basic':
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'Suspended':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'Trial':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
};

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Welcome back, Super Admin. Here's your platform overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="bg-slate-900 border-slate-800 overflow-hidden"
            >
              <div className={`h-1 bg-gradient-to-r ${card.accentColor}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-300">
                  {card.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${card.textColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-100">
                  {card.value}
                </div>
                {card.hasAnimation && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs text-emerald-400">Live</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Growth Chart */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">MRR Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mrrData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => formatCurrency(value as number)}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#a855f7"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">
              Subscription Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                  }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value, entry: any) => (
                    <span className="text-xs text-slate-300">
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Restaurants Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">All Restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-300">Restaurant</TableHead>
                <TableHead className="text-slate-300">Owner</TableHead>
                <TableHead className="text-slate-300">Plan</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300 text-right">Tables</TableHead>
                <TableHead className="text-slate-300 text-right">Revenue</TableHead>
                <TableHead className="text-slate-300">Joined</TableHead>
                <TableHead className="text-slate-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurantsMockData.map((restaurant) => (
                <TableRow key={restaurant.id} className="border-slate-800">
                  <TableCell>
                    <Link href={`/admin/restaurants/${restaurant.id}`}>
                      <div className="cursor-pointer hover:text-purple-400 transition">
                        <p className="font-semibold text-slate-100">
                          {restaurant.name}
                        </p>
                        <p className="text-xs text-slate-400">{restaurant.city}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {restaurant.owner}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${getPlanBadgeColor(restaurant.plan)}`}>
                      {restaurant.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${getStatusBadgeColor(restaurant.status)}`}>
                      {restaurant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-300">
                    {restaurant.tables}
                  </TableCell>
                  <TableCell className="text-right text-slate-300">
                    {formatCurrency(restaurant.revenue)}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {formatDate(restaurant.joined)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4 text-slate-400 hover:text-purple-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Ban className="h-4 w-4 text-slate-400 hover:text-red-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ArrowUpCircle className="h-4 w-4 text-slate-400 hover:text-amber-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Signups */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-100">Recent Signups</CardTitle>
          <Link href="/admin/restaurants">
            <Button variant="link" className="text-purple-400 hover:text-purple-300">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSignups.map((signup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-800/20"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-100">{signup.name}</p>
                  <p className="text-sm text-slate-400">{signup.owner}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={`border ${getPlanBadgeColor(signup.plan)}`}>
                    {signup.plan}
                  </Badge>
                  <p className="text-sm text-slate-400 w-20 text-right">
                    {signup.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
