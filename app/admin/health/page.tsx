'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity, Server, Database, AlertTriangle, Wifi, Zap,
  Clock, CheckCircle, XCircle, Bell, Smartphone, Mail,
  MessageSquare, RefreshCw, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime, formatPercentage } from '@/lib/format';
import { getHealthData } from '@/lib/actions/admin';

const statusColors: Record<string, string> = {
  Operational: 'bg-primary/10 text-primary border-primary/30',
  Degraded: 'bg-accent/10 text-accent border-accent/30',
  Outage: 'bg-destructive/10 text-destructive border-destructive/30',
};

const alertTypeColors: Record<string, string> = {
  warning: 'bg-accent/10 text-accent border-accent/30',
  error: 'bg-destructive/10 text-destructive border-destructive/30',
  info: 'bg-info/10 text-info border-info/30',
};

const alertStatusColors: Record<string, string> = {
  Pending: 'bg-accent/10 text-accent border-accent/30',
  Acknowledged: 'bg-primary/10 text-primary border-primary/30',
};

export default function SystemHealth() {
  const [alertChannels, setAlertChannels] = useState({
    email: true,
    sms: true,
    slack: false,
  });
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getHealthData().then(setData);
  }, []);

  const toggleChannel = (channel: keyof typeof alertChannels) => {
    setAlertChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">System Health</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time monitoring and alert management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-primary/30 text-primary bg-primary/5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
            Live
          </Badge>
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
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
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
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
            {!data || data.errorRates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
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
            <div
              onClick={() => toggleChannel('email')}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">admin@resthru.com</p>
                </div>
              </div>
              <div className={`h-6 w-11 rounded-full transition-colors ${
                alertChannels.email ? 'bg-primary' : 'bg-muted border border-border'
              }`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${
                  alertChannels.email ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
            <div
              onClick={() => toggleChannel('sms')}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">SMS Alerts</p>
                  <p className="text-xs text-muted-foreground">+977 9801234567</p>
                </div>
              </div>
              <div className={`h-6 w-11 rounded-full transition-colors ${
                alertChannels.sms ? 'bg-primary' : 'bg-muted border border-border'
              }`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${
                  alertChannels.sms ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
            <div
              onClick={() => toggleChannel('slack')}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Slack Alerts</p>
                  <p className="text-xs text-muted-foreground">#alerts channel</p>
                </div>
              </div>
              <div className={`h-6 w-11 rounded-full transition-colors ${
                alertChannels.slack ? 'bg-primary' : 'bg-muted border border-border'
              }`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${
                  alertChannels.slack ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`} />
              </div>
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
          {!data || data.recentAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
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
