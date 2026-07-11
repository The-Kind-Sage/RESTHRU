'use client';

import React, { useEffect, useState } from 'react';
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
import { getPipelineData } from '@/lib/actions/admin';

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
  const [data, setData] = useState<any>(null);
  const [trialFilter, setTrialFilter] = useState('all');

  useEffect(() => {
    getPipelineData().then(setData);
  }, []);

  if (!data) {
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
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  const totalLeads = data.totalRestaurants;
  const activeTrials = data.subscriptions.filter((s: any) => s.status === "ACTIVE").length;
  const converted = data.subscriptions.filter((s: any) => s.status === "ACTIVE" && new Date(s.startDate) <= new Date()).length;

  const filteredSubscriptions = data.subscriptions.filter((s: any) => {
    if (trialFilter === 'all') return true;
    const daysUntilEnd = (new Date(s.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (trialFilter === 'at-risk') return s.status === 'ACTIVE' && daysUntilEnd < 7 && daysUntilEnd >= 0;
    if (trialFilter === 'expiring') return daysUntilEnd >= 0 && daysUntilEnd <= 30;
    if (trialFilter === 'engaged') return s.status === 'ACTIVE';
    return true;
  });

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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-4 px-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatNumber(totalLeads)}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-4 px-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatNumber(activeTrials)}</p>
            <p className="text-xs text-muted-foreground">Active Trials</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-4 px-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatNumber(converted)}</p>
            <p className="text-xs text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-4 px-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatNumber(data.recentRestaurants.length)}</p>
            <p className="text-xs text-muted-foreground">Recent Signups</p>
          </CardContent>
        </Card>
      </div>

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
            {data.recentActivity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 10).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-foreground">{log.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {log.restaurant?.name} &middot; {formatRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              <Select value={trialFilter} onValueChange={setTrialFilter}>
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
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No trial data matching the current filter</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-foreground">{s.restaurant.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.plan.name}</TableCell>
                      <TableCell>
                        <Badge className={`border text-[10px] ${
                          s.status === "ACTIVE" ? "bg-primary/10 text-primary border-primary/30" :
                          s.status === "TRIAL" ? "bg-accent/10 text-accent border-accent/30" :
                          "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30"
                        }`}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(s.startDate)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(s.endDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
          {data.recentRestaurants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No onboarding data</div>
          ) : (
            <div className="space-y-3">
              {data.recentRestaurants.slice(0, 8).map((r: any) => {
                const steps = [
                  { label: "Profile Setup", done: !!r.name },
                  { label: "Menu Added", done: r._count.menuItems > 0 },
                  { label: "Staff Added", done: r._count.users > 0 },
                  { label: "Active", done: r.isActive },
                ];
                const completed = steps.filter((s) => s.done).length;
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.city || "N/A"} &middot; {formatRelativeTime(r.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{completed}/{steps.length}</span>
                      <div className="flex gap-1">
                        {steps.map((step, i) => (
                          <div key={i} className={`h-2 w-2 rounded-full ${step.done ? 'bg-primary' : 'bg-muted border border-border'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
