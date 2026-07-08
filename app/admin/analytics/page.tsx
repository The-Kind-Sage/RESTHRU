'use client';

import React, { useState, useEffect } from 'react';
import {
  Download, Clock, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getAnalyticsOverview } from '@/lib/actions/admin';

const datePresets = ['7D', '30D', '90D', '1Y'];

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
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getAnalyticsOverview(activePeriod).then(setData);
  }, [activePeriod]);

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
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-6 px-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Restaurants</p>
            <p className="text-2xl font-bold text-foreground">{data ? data.totalRestaurants.toLocaleString() : "..."}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-6 px-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-foreground">{data ? data.totalOrders.toLocaleString() : "..."}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-6 px-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground">{data ? `NPR ${Math.round(data.totalRevenue).toLocaleString()}` : "..."}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-6 px-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Order Value</p>
            <p className="text-2xl font-bold text-foreground">{data ? `NPR ${Math.round(data.avgOrderValue).toLocaleString()}` : "..."}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Revenue Over Time</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Daily revenue trend for the selected period</p>
          </CardHeader>
          <CardContent>
            {!data || data.revenueOverTime.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No revenue data available</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueOverTime}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Cuisines */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Popular Cuisines</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Restaurant distribution by cuisine type</p>
          </CardHeader>
          <CardContent>
            {!data || data.cuisineData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No cuisine data available</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.cuisineData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {data.cuisineData.map((entry: any, idx: number) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
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
            {!data || data.paymentData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No payment data available</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.paymentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {data.paymentData.map((entry: any, idx: number) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Cities by Revenue */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Top Cities by Revenue</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue contribution by city</p>
          </CardHeader>
          <CardContent>
            {!data || data.cityData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No city data available</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.cityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis type="category" dataKey="city" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Peak Hours</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Order volume by hour of day</p>
          </CardHeader>
          <CardContent>
            {!data || data.peakHoursData.every((d: any) => d.orders === 0) ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No peak hours data available</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
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
          {!data || data.featureData.every((f: any) => f.adoption === 0) ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No feature adoption data available</div>
          ) : (
            <div className="space-y-4">
              {data.featureData.map((f: any) => (
                <div key={f.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{f.name}</span>
                    <span className="text-muted-foreground">{f.adoption.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted border border-border overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${f.adoption}%`, backgroundColor: f.fill }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
