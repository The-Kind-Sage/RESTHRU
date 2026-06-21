'use client';

import React from 'react';
import {
  Phone, Mail, Calendar, Clock, ChevronRight, ChevronLeft,
  ArrowUpRight, Activity, CheckCircle, Timer, UserPlus,
  Building2, MoreHorizontal, Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime, formatPercentage } from '@/lib/format';

const activityIcons: Record<string, React.ElementType> = {
  demo: Calendar,
  trial: CheckCircle,
  contact: Mail,
  lead: UserPlus,
  negotiation: Clock,
};

const stageBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    'At Risk': 'bg-destructive/10 text-destructive border-destructive/30',
    'Engaged': 'bg-info/10 text-info border-info/30',
    'Expiring': 'bg-accent/10 text-accent border-accent/30',
    'Onboarded': 'bg-primary/10 text-primary border-primary/30',
  };
  return colors[status] || 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30';
};

const activationBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    'Activated': 'bg-primary/10 text-primary border-primary/30',
    'In Progress': 'bg-accent/10 text-accent border-accent/30',
    'Pending': 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  };
  return colors[status] || 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30';
};

export default function AdminPipeline() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Track leads, trials, and conversions across the funnel</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      <div className="text-center py-12 text-muted-foreground text-sm">No pipeline data available</div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">Recent Activity</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Latest prospect interactions</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No recent activity</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm font-medium text-foreground">Trial Management</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Active trials requiring attention</p>
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[120px] bg-muted border-border text-foreground h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all" className="text-foreground text-xs">All Trials</SelectItem>
                  <SelectItem value="at-risk" className="text-foreground text-xs">At Risk</SelectItem>
                  <SelectItem value="expiring" className="text-foreground text-xs">Expiring</SelectItem>
                  <SelectItem value="engaged" className="text-foreground text-xs">Engaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No trial data</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">Onboarding Checklist</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Track restaurant activation progress</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">No onboarding data</div>
        </CardContent>
      </Card>
    </div>
  );
}
