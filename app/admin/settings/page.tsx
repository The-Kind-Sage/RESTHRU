'use client';

import React from 'react';
import {
  Settings,
  ShieldCheck,
  Users,
  Key,
  Database,
  RefreshCw,
  Download,
  Upload,
  Edit3,
  UserX,
  UserCheck,
  Plus,
  Eye,
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate, formatRelativeTime, formatNumber } from '@/lib/format';

const roles = [
  {
    name: 'Super Admin', memberCount: 2, color: 'hsl(var(--primary))',
    permissions: ['Full system access', 'User management', 'Billing & plans', 'Security config', 'All modules'],
  },
  {
    name: 'Sales Admin', memberCount: 5, color: 'hsl(var(--info))',
    permissions: ['Restaurant profiles', 'Pipeline view', 'Lead management', 'Reports'],
  },
  {
    name: 'Support Admin', memberCount: 8, color: 'hsl(var(--accent))',
    permissions: ['Ticket management', 'Restaurant lookup', 'Announcements', 'FAQ management'],
  },
  {
    name: 'Finance Admin', memberCount: 3, color: 'hsl(var(--destructive))',
    permissions: ['Transaction logs', 'Invoice access', 'Refund processing', 'P&L reports'],
  },
  {
    name: 'Read-Only Admin', memberCount: 4, color: 'hsl(var(--muted-foreground))',
    permissions: ['Dashboard view only', 'Report access', 'No edit rights', 'Export allowed'],
  },
];

const teamMembers = [
  { name: 'Anish Sharma', email: 'anish@resthru.com', role: 'Super Admin', status: 'Active', lastActive: '2026-06-17T10:30:00' },
  { name: 'Priya Shakya', email: 'priya@resthru.com', role: 'Super Admin', status: 'Active', lastActive: '2026-06-17T09:15:00' },
  { name: 'Deepak Ale', email: 'deepak@resthru.com', role: 'Sales Admin', status: 'Active', lastActive: '2026-06-16T14:20:00' },
  { name: 'Sunita Tamang', email: 'sunita@resthru.com', role: 'Support Admin', status: 'Active', lastActive: '2026-06-17T08:45:00' },
  { name: 'Govind Thapa', email: 'govind@resthru.com', role: 'Finance Admin', status: 'Active', lastActive: '2026-06-15T16:30:00' },
  { name: 'Harish Limbu', email: 'harish@resthru.com', role: 'Read-Only Admin', status: 'Invited', lastActive: '' },
  { name: 'Maya Rai', email: 'maya@resthru.com', role: 'Support Admin', status: 'Suspended', lastActive: '2026-06-10T11:00:00' },
];

const platformConfig = [
  { label: 'Default Plan', value: 'Basic' },
  { label: 'Trial Days', value: '14' },
  { label: 'Tax Rate', value: '13%' },
  { label: 'Payment Gateways', value: 'eSewa, Khalti, Fonepay' },
  { label: 'SMS Provider', value: 'Sparrow' },
  { label: 'Email Provider', value: 'SendGrid' },
];

const apiUsage = {
  requestsToday: 12847,
  errorRate: 0.3,
  rateLimit: 100,
};

const backup = {
  schedule: 'Daily at 02:00 NPT',
  lastBackup: '2026-06-17T02:00:00',
};

const RoleCard = ({ role }: { role: typeof roles[0] }) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {roles.map((role) => (
              <RoleCard key={role.name} role={role} />
            ))}
          </div>
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Last Active</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.email} className="border-border hover:bg-muted/50 transition-colors">
                  <TableCell><span className="text-sm font-medium text-foreground">{member.name}</span></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{member.email}</span></TableCell>
                  <TableCell><span className="text-xs text-foreground/70">{member.role}</span></TableCell>
                  <TableCell><StatusBadge status={member.status} /></TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {member.lastActive ? formatRelativeTime(new Date(member.lastActive)) : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-accent">
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <UserCheck className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformConfig.map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </div>
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
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Rate Limit</p>
                  <div className="flex items-center gap-2 mt-1">
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
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground">Requests Today</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{formatNumber(apiUsage.requestsToday)}</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground">Error Rate</p>
                  <p className="text-lg font-bold text-primary mt-0.5">{apiUsage.errorRate}%</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Backup Schedule</p>
              <p className="text-sm font-medium text-foreground mt-1">{backup.schedule}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Last Backup</p>
              <p className="text-sm font-medium text-foreground mt-1">{formatRelativeTime(new Date(backup.lastBackup))}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(new Date(backup.lastBackup))}</p>
            </div>
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
