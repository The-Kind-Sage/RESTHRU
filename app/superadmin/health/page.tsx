'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity, Server, Database, Bell, Smartphone, Mail,
  MessageSquare, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatNumber, formatRelativeTime } from '@/lib/format';
import { getHealthData } from '@/lib/actions/admin';
import { getHealthAlertChannels, updateHealthAlertChannel, type AlertChannels } from '@/lib/actions/admin-settings';
import { ADMIN_TONE_CLASSES } from '@/lib/constants';
import { SectionSkeleton } from '@/components/superadmin/skeletons';
import { PageHeader } from '@/components/shared/page-header';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  Operational: ADMIN_TONE_CLASSES.positive,
  Degraded: ADMIN_TONE_CLASSES.warning,
  Outage: ADMIN_TONE_CLASSES.negative,
};

const alertTypeColors: Record<string, string> = {
  warning: ADMIN_TONE_CLASSES.warning,
  error: ADMIN_TONE_CLASSES.negative,
  info: ADMIN_TONE_CLASSES.info,
};

export default function SystemHealth() {
  const [alertChannels, setAlertChannels] = useState<AlertChannels>({
    email: true,
    sms: true,
    slack: false,
  });
  const [savingChannel, setSavingChannel] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getHealthData().then(setData);
    getHealthAlertChannels().then((res) => {
      if (res.data) setAlertChannels(res.data);
    });
  }, []);

  const toggleChannel = async (channel: keyof AlertChannels) => {
    const next = !alertChannels[channel];
    setAlertChannels((prev) => ({ ...prev, [channel]: next }));
    setSavingChannel(channel);
    const res = await updateHealthAlertChannel(channel, next);
    setSavingChannel(null);
    if (res.error) {
      // Revert on failure — don't leave the UI claiming a save that didn't happen.
      setAlertChannels((prev) => ({ ...prev, [channel]: !next }));
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="System Health" description="Real-time monitoring and alert management">
        <Badge className="border-primary/30 text-primary bg-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          Live
        </Badge>
        <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
        </Button>
      </PageHeader>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          {!data ? (
            <SectionSkeleton rows={3} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Server className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Restaurants</p>
                  <p className="text-lg font-bold text-foreground">{formatNumber(data.totalRestaurants)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-lg font-bold text-foreground">{formatNumber(data.activeRestaurants)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Database className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-bold text-foreground">{formatNumber(data.totalOrders)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Services Overview</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Current status of all platform services</p>
        </CardHeader>
        <CardContent>
          {!data ? (
            <SectionSkeleton rows={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "API Server", status: "Operational", icon: Server },
                { name: "Database", status: "Operational", icon: Database },
                { name: "Order Processing", status: data.totalOrders > 0 ? "Operational" : "Degraded", icon: Activity },
                { name: "Notifications", status: "Operational", icon: Bell },
              ].map((svc) => {
                const Icon = svc.icon;
                return (
                  <div key={svc.name} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-xs text-foreground">{svc.name}</span>
                    </div>
                    <Badge className={`border text-[10px] ${statusColors[svc.status] || ''}`}>{svc.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Error Rates by Restaurant</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Top 5 error-prone restaurants</p>
          </CardHeader>
          <CardContent>
            {!data ? (
              <SectionSkeleton rows={3} />
            ) : data.errorRates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No errors reported — all restaurants healthy</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Error Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.errorRates.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-foreground">{e.name}</TableCell>
                      <TableCell>
                        <Badge className="border text-[10px] bg-destructive/10 text-destructive border-destructive/30">{e.errors}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-foreground">Alert Configuration</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Toggle alert notification channels</p>
            </div>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">admin@resthru.com</p>
                </div>
              </div>
              <Switch
                checked={alertChannels.email}
                disabled={savingChannel === 'email'}
                onCheckedChange={() => toggleChannel('email')}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">SMS Alerts</p>
                  <p className="text-xs text-muted-foreground">+977 9801234567</p>
                </div>
              </div>
              <Switch
                checked={alertChannels.sms}
                disabled={savingChannel === 'sms'}
                onCheckedChange={() => toggleChannel('sms')}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Slack Alerts</p>
                  <p className="text-xs text-muted-foreground">#alerts channel</p>
                </div>
              </div>
              <Switch
                checked={alertChannels.slack}
                disabled={savingChannel === 'slack'}
                onCheckedChange={() => toggleChannel('slack')}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-foreground">Recent Alerts</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">System activity and alert feed</p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
            Streaming
          </Badge>
        </CardHeader>
        <CardContent>
          {!data ? (
            <SectionSkeleton rows={4} />
          ) : data.recentAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No recent activity</div>
          ) : (
            <div className="space-y-3">
              {data.recentAlerts.map((alert: any) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className={`h-2 w-2 rounded-full mt-1.5 ${
                    alert.type === "error" || alert.type === "ERROR" ? "bg-destructive" : "bg-primary"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{alert.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`border text-[10px] ${alertTypeColors[alert.type === "error" ? "error" : "info"]}`}>
                        {alert.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{alert.restaurant}</span>
                      <span className="text-[10px] text-muted-foreground">{formatRelativeTime(alert.createdAt)}</span>
                    </div>
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
