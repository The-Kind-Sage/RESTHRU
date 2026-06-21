'use client';

import React, { useState } from 'react';
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

      {/* KPI Row - Empty State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border shadow-sm">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground text-sm">No data available</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Revenue Over Time</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue trend for the selected period</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No revenue data available</div>
          </CardContent>
        </Card>

        {/* Popular Cuisines */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Popular Cuisines</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Order distribution by cuisine type</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No cuisine data available</div>
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
            <div className="text-center py-12 text-muted-foreground text-sm">No payment data available</div>
          </CardContent>
        </Card>

        {/* Top Cities by Revenue */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Top Cities by Revenue</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue contribution by city</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No city data available</div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Peak Hours</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Order volume by hour of day</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No peak hours data available</div>
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
          <div className="text-center py-12 text-muted-foreground text-sm">No feature adoption data available</div>
        </CardContent>
      </Card>
    </div>
  );
}
