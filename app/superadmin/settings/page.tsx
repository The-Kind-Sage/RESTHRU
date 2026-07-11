'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Users,
  Key,
  Database,
  RefreshCw,
  Download,
  Upload,
  Plus,
  EyeOff,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatNumber, formatDate } from '@/lib/format';
import { getAdminUsers, getPlatformStats } from '@/lib/actions/admin';

const RoleCard = ({ role }: { role: { name: string; memberCount: number; color: string; permissions: string[] } }) => (
  <div className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: role.color }} />
        <h3 className="text-sm font-medium text-foreground">{role.name}</h3>
      </div>
      <Badge className="bg-muted text-muted-foreground border border-border text-[10px]">{role.memberCount} members</Badge>
    </div>
    <ul className="space-y-1">
      {role.permissions.map((perm) => (
        <li key={perm} className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-primary" />
          <span className="text-[11px] text-muted-foreground">{perm}</span>
        </li>
      ))}
    </ul>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Active: 'bg-primary/10 text-primary border-primary/30',
    Invited: 'bg-info/10 text-info border-info/30',
    Suspended: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

export default function AdminSettings() {
  const [adminData, setAdminData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getAdminUsers().then(setAdminData);
    getPlatformStats().then(setStats);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin roles, team management, security & platform configuration</p>
        </div>
        <Button variant="outline" size="sm" className="border-border text-primary hover:bg-primary/10">
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
        </Button>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Admin Roles</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!adminData ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No role data available</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {adminData.roleGroups.map((role: any) => (
                <RoleCard key={role.name} role={role} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">Team Management</CardTitle>
            </div>
            <Button size="sm" className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!adminData || adminData.users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No team members</div>
          ) : (
            <div className="space-y-3">
              {adminData.users.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={user.isActive ? "Active" : "Suspended"} />
                    <span className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm font-medium text-foreground">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground mt-0.5">Additional security layer for admin accounts</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/30">
              <ShieldCheck className="h-3 w-3 mr-1" /> Enabled
            </Badge>
          </div>
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">IP Whitelist</p>
                <p className="text-xs text-muted-foreground mt-0.5">Restrict admin access to specific IP addresses</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  defaultValue="103.1.85.0/24"
                  className="w-48 bg-muted border-border text-foreground text-sm h-9"
                />
                <Button variant="outline" size="sm" className="border-border text-primary hover:bg-primary/10 h-9">
                  Update
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Session Timeout</p>
                <p className="text-xs text-muted-foreground mt-0.5">Auto-logout idle admin sessions</p>
              </div>
              <Select defaultValue="1h">
                <SelectTrigger className="w-[130px] bg-muted border-border text-foreground h-9 text-sm">
                  <SelectValue placeholder="Timeout" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="30m" className="text-foreground">30 minutes</SelectItem>
                  <SelectItem value="1h" className="text-foreground">1 hour</SelectItem>
                  <SelectItem value="2h" className="text-foreground">2 hours</SelectItem>
                  <SelectItem value="4h" className="text-foreground">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Platform Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!stats ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No configuration data</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalRestaurants)}</p>
                <p className="text-xs text-muted-foreground">Restaurants</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalUsers)}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalOrders)}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalStaff)}</p>
                <p className="text-xs text-muted-foreground">Staff</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">API Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Primary API Key</p>
              <div className="flex items-center gap-2">
                <code className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground font-mono">
                  sk_resthru_••••••••••••a3f8
                </code>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-border text-primary hover:bg-primary/10 h-9 ml-4">
              <Plus className="h-4 w-4 mr-1.5" /> Generate New
            </Button>
          </div>
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Rate Limit</p>
                <div className="flex items-center gap-2">
                  <Input
                    defaultValue="100"
                    className="w-20 bg-muted border-border text-foreground text-sm h-9 text-center"
                  />
                  <span className="text-sm text-foreground/70">requests/min</span>
                  <Button variant="outline" size="sm" className="border-border text-primary hover:bg-primary/10 h-9">
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Backup / Restore</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border flex items-end">
              <Button className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] text-white h-9">
                <Download className="h-4 w-4 mr-1.5" /> Manual Backup
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border flex items-end">
              <Button variant="outline" className="w-full border-border text-accent hover:bg-accent/10 h-9">
                <Upload className="h-4 w-4 mr-1.5" /> Restore
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
