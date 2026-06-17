'use client';

import React, { useState } from 'react';
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

interface Service {
  name: string;
  status: string;
  uptime: number;
  responseTime: string;
  lastIncident: string;
}

interface ErrorRestaurant {
  name: string;
  errors: number;
  feature: string;
}

interface Alert {
  time: string;
  type: string;
  message: string;
  status: string;
}

const statusCards = [
  { title: 'Server Status', value: 'Online', icon: Server, color: 'hsl(var(--primary))', subtitle: 'All systems operational', pulse: true },
  { title: 'API Response Time', value: '245ms', icon: Activity, color: 'hsl(var(--info))', subtitle: 'Avg over last 5 min', trend: '-12ms', trendUp: true },
  { title: 'Database', value: '97.2%', icon: Database, color: 'hsl(var(--primary))', subtitle: 'Uptime this month', trend: '+0.3%', trendUp: true },
  { title: 'Error Rate', value: '0.8%', icon: AlertTriangle, color: 'hsl(var(--accent))', subtitle: 'Last 24 hours', trend: '-0.2%', trendUp: true },
];

const services: Service[] = [
  { name: 'Authentication Service', status: 'Operational', uptime: 99.98, responseTime: '45ms', lastIncident: '30 days ago' },
  { name: 'Payment Gateway', status: 'Operational', uptime: 99.95, responseTime: '210ms', lastIncident: '14 days ago' },
  { name: 'POS Sync Engine', status: 'Operational', uptime: 99.87, responseTime: '180ms', lastIncident: '7 days ago' },
  { name: 'Notification Service', status: 'Degraded', uptime: 98.20, responseTime: '890ms', lastIncident: '2 hours ago' },
  { name: 'Analytics Pipeline', status: 'Operational', uptime: 99.99, responseTime: '320ms', lastIncident: '60 days ago' },
  { name: 'File Upload Service', status: 'Outage', uptime: 95.10, responseTime: '5000ms', lastIncident: 'Ongoing' },
  { name: 'Search Index', status: 'Operational', uptime: 99.92, responseTime: '65ms', lastIncident: '21 days ago' },
];

const errorRestaurants: ErrorRestaurant[] = [
  { name: 'Kathmandu Cafe', errors: 47, feature: 'Payment Gateway' },
  { name: 'Nuwakot Dining', errors: 38, feature: 'POS Sync' },
  { name: 'Ilam Coffee & Kitchen', errors: 29, feature: 'Menu Editor' },
  { name: 'Rara Valley Kitchen', errors: 22, feature: 'Order Processing' },
  { name: 'Dhulikhel Traditional', errors: 18, feature: 'Invoice Generation' },
];

const recentAlerts: Alert[] = [
  { time: '2 min ago', type: 'warning', message: 'Notification queue depth at 12,000 messages', status: 'Pending' },
  { time: '15 min ago', type: 'error', message: 'File upload service timeout on 3 requests', status: 'Acknowledged' },
  { time: '32 min ago', type: 'info', message: 'Auto-scaling triggered: +2 API instances', status: 'Acknowledged' },
  { time: '1h ago', type: 'warning', message: 'Database connection pool at 82% capacity', status: 'Pending' },
  { time: '2h ago', type: 'info', message: 'Deployment v2.8.1 rolled out to production', status: 'Acknowledged' },
  { time: '3h ago', type: 'error', message: 'Payment gateway latency spike to 2.1s', status: 'Acknowledged' },
  { time: '5h ago', type: 'info', message: 'SSL certificate renewed for resthru.com', status: 'Acknowledged' },
  { time: '8h ago', type: 'warning', message: 'CDN cache hit rate dropped to 67%', status: 'Pending' },
];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card) => {
          const Icon = card.icon;
          const isOnline = card.value === 'Online';
          return (
            <Card key={card.title} className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</CardTitle>
                <Icon className="h-4.5 w-4.5" style={{ color: card.color }} strokeWidth={1.5} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground tracking-tight" style={{ color: card.color }}>{card.value}</span>
                  {card.pulse && (
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtitle}</p>
                {card.trend && (
                  <div className="flex items-center gap-1 mt-2">
                    {card.trendUp ? (
                      <ArrowUpRight className="h-3 w-3 text-primary" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                    )}
                    <span className={`text-xs ${card.trendUp ? 'text-primary' : 'text-destructive'}`}>{card.trend}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">Services Overview</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Current status of all platform services</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Service</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Uptime</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Response Time</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Last Incident</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.name} className="border-border hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        s.status === 'Operational' ? 'bg-primary' : s.status === 'Degraded' ? 'bg-accent' : 'bg-destructive'
                      }`} />
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border text-[10px] ${statusColors[s.status]}`}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-foreground/70 text-sm">{s.uptime}%</TableCell>
                  <TableCell className="text-right text-foreground/70 text-sm font-mono">{s.responseTime}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.lastIncident}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">Error Rates by Restaurant</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Top 5 error-prone restaurants</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Error Count</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Feature</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorRestaurants.map((r) => (
                  <TableRow key={r.name} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">{r.name}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={`border text-[10px] ${
                        r.errors >= 30 ? 'bg-destructive/10 text-destructive border-destructive/30'
                          : r.errors >= 20 ? 'bg-accent/10 text-accent border-accent/30'
                          : 'bg-info/10 text-info border-info/30'
                      }`}>{formatNumber(r.errors)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.feature}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors">
                <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.type === 'error' ? 'bg-destructive' : alert.type === 'warning' ? 'bg-accent' : 'bg-info'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className={`border text-[9px] ${alertTypeColors[alert.type]}`}>{alert.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="text-xs text-foreground/70">{alert.message}</p>
                </div>
                <Badge className={`border text-[9px] flex-shrink-0 ${alertStatusColors[alert.status]}`}>{alert.status}</Badge>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full text-xs text-primary hover:text-foreground">
              View All Alerts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
