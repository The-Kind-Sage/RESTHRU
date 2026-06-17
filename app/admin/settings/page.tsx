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
    name: 'Super Admin', memberCount: 2, color: '#12B877',
    permissions: ['Full system access', 'User management', 'Billing & plans', 'Security config', 'All modules'],
  },
  {
    name: 'Sales Admin', memberCount: 5, color: '#3B82F6',
    permissions: ['Restaurant profiles', 'Pipeline view', 'Lead management', 'Reports'],
  },
  {
    name: 'Support Admin', memberCount: 8, color: '#F4B740',
    permissions: ['Ticket management', 'Restaurant lookup', 'Announcements', 'FAQ management'],
  },
  {
    name: 'Finance Admin', memberCount: 3, color: '#DB3A3A',
    permissions: ['Transaction logs', 'Invoice access', 'Refund processing', 'P&L reports'],
  },
  {
    name: 'Read-Only Admin', memberCount: 4, color: '#768B80',
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
  <div className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B] hover:border-[#12B877]/30 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: role.color }} />
        <h3 className="text-sm font-medium text-white">{role.name}</h3>
      </div>
      <Badge className="bg-[#1A231E] text-[#768B80] border border-[#25332B] text-[10px]">{role.memberCount} members</Badge>
    </div>
    <ul className="space-y-1">
      {role.permissions.map((perm) => (
        <li key={perm} className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-[#12B877]" />
          <span className="text-[11px] text-[#768B80]">{perm}</span>
        </li>
      ))}
    </ul>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Active: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    Invited: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30',
    Suspended: 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30',
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

export default function AdminSettings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-sm text-[#768B80] mt-1">Admin roles, team management, security & platform configuration</p>
        </div>
        <Button variant="outline" size="sm" className="border-[#25332B] text-[#12B877] hover:bg-[#12B877]/10">
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
        </Button>
      </div>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">Admin Roles</CardTitle>
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

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#12B877]" />
              <CardTitle className="text-sm font-medium text-white">Team Management</CardTitle>
            </div>
            <Button size="sm" className="bg-[#12B877] hover:bg-[#0E945E] text-white h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Last Active</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.email} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell><span className="text-sm font-medium text-white">{member.name}</span></TableCell>
                  <TableCell><span className="text-xs text-[#768B80]">{member.email}</span></TableCell>
                  <TableCell><span className="text-xs text-white/70">{member.role}</span></TableCell>
                  <TableCell><StatusBadge status={member.status} /></TableCell>
                  <TableCell>
                    <span className="text-xs text-[#768B80]">
                      {member.lastActive ? formatRelativeTime(new Date(member.lastActive)) : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#768B80] hover:text-[#12B877]">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#768B80] hover:text-[#F4B740]">
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#768B80] hover:text-[#DB3A3A]">
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

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#F4B740]" />
            <CardTitle className="text-sm font-medium text-white">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
              <p className="text-xs text-[#768B80] mt-0.5">Additional security layer for admin accounts</p>
            </div>
            <Badge className="bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30">
              <ShieldCheck className="h-3 w-3 mr-1" /> Enabled
            </Badge>
          </div>
          <div className="border-t border-[#25332B] pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">IP Whitelist</p>
                <p className="text-xs text-[#768B80] mt-0.5">Restrict admin access to specific IP addresses</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  defaultValue="103.1.85.0/24"
                  className="w-48 bg-[#1A231E] border-[#25332B] text-white text-sm h-9"
                />
                <Button variant="outline" size="sm" className="border-[#25332B] text-[#12B877] hover:bg-[#12B877]/10 h-9">
                  Update
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-[#25332B] pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Session Timeout</p>
                <p className="text-xs text-[#768B80] mt-0.5">Auto-logout idle admin sessions</p>
              </div>
              <Select defaultValue="1h">
                <SelectTrigger className="w-[130px] bg-[#1A231E] border-[#25332B] text-white h-9 text-sm">
                  <SelectValue placeholder="Timeout" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1711] border-[#25332B]">
                  <SelectItem value="30m" className="text-white">30 minutes</SelectItem>
                  <SelectItem value="1h" className="text-white">1 hour</SelectItem>
                  <SelectItem value="2h" className="text-white">2 hours</SelectItem>
                  <SelectItem value="4h" className="text-white">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">Platform Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformConfig.map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-[#1A231E]/50 border border-[#25332B]">
                <p className="text-[10px] text-[#768B80] uppercase tracking-wider font-medium">{item.label}</p>
                <p className="text-sm font-medium text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">API Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-[#768B80] mb-1">Primary API Key</p>
              <div className="flex items-center gap-2">
                <code className="bg-[#1A231E] border border-[#25332B] rounded-lg px-3 py-2 text-sm text-[#768B80] font-mono">
                  sk_resthru_••••••••••••a3f8
                </code>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#768B80] hover:text-white">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#768B80] hover:text-white">
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-[#25332B] text-[#12B877] hover:bg-[#12B877]/10 h-9 ml-4">
              <Plus className="h-4 w-4 mr-1.5" /> Generate New
            </Button>
          </div>
          <div className="border-t border-[#25332B] pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-[#768B80]">Rate Limit</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      defaultValue="100"
                      className="w-20 bg-[#1A231E] border-[#25332B] text-white text-sm h-9 text-center"
                    />
                    <span className="text-sm text-white/70">requests/min</span>
                    <Button variant="outline" size="sm" className="border-[#25332B] text-[#12B877] hover:bg-[#12B877]/10 h-9">
                      Save
                    </Button>
                  </div>
                </div>
                <div className="h-10 w-px bg-[#25332B]" />
                <div>
                  <p className="text-xs text-[#768B80]">Requests Today</p>
                  <p className="text-lg font-bold text-white mt-0.5">{formatNumber(apiUsage.requestsToday)}</p>
                </div>
                <div className="h-10 w-px bg-[#25332B]" />
                <div>
                  <p className="text-xs text-[#768B80]">Error Rate</p>
                  <p className="text-lg font-bold text-[#12B877] mt-0.5">{apiUsage.errorRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">Backup / Restore</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B]">
              <p className="text-[10px] text-[#768B80] uppercase tracking-wider font-medium">Backup Schedule</p>
              <p className="text-sm font-medium text-white mt-1">{backup.schedule}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B]">
              <p className="text-[10px] text-[#768B80] uppercase tracking-wider font-medium">Last Backup</p>
              <p className="text-sm font-medium text-white mt-1">{formatRelativeTime(new Date(backup.lastBackup))}</p>
              <p className="text-[10px] text-[#768B80] mt-0.5">{formatDate(new Date(backup.lastBackup))}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B] flex items-end">
              <Button className="w-full bg-[#12B877] hover:bg-[#0E945E] text-white h-9">
                <Download className="h-4 w-4 mr-1.5" /> Manual Backup
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B] flex items-end">
              <Button variant="outline" className="w-full border-[#25332B] text-[#F4B740] hover:bg-[#F4B740]/10 h-9">
                <Upload className="h-4 w-4 mr-1.5" /> Restore
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
