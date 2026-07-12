'use client';

import { PageHeader } from '@/components/shared/page-header';

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
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatNumber, formatDate } from '@/lib/format';
import { getAdminUsers, getPlatformStats } from '@/lib/actions/admin';
import {
  getAdminSecuritySettings, updateAdminSecuritySettings, regenerateAdminApiKey,
  type AdminSecuritySettings,
} from '@/lib/actions/admin-settings';
import { ADMIN_TONE_CLASSES } from '@/lib/constants';
import { SectionSkeleton } from '@/components/superadmin/skeletons';
import { toast } from 'sonner';

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
    Active: ADMIN_TONE_CLASSES.positive,
    Invited: ADMIN_TONE_CLASSES.info,
    Suspended: ADMIN_TONE_CLASSES.negative,
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

function maskKey(key: string) {
  if (!key) return '';
  const tail = key.slice(-4);
  return `sk_resthru_${'•'.repeat(12)}${tail}`;
}

export default function AdminSettings() {
  const [adminData, setAdminData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [security, setSecurity] = useState<AdminSecuritySettings | null>(null);
  const [ipInput, setIpInput] = useState('');
  const [rateLimitInput, setRateLimitInput] = useState('');
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [savingIp, setSavingIp] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    getAdminUsers().then(setAdminData);
    getPlatformStats().then(setStats);
    getAdminSecuritySettings().then((res) => {
      if (res.data) {
        setSecurity(res.data);
        setIpInput(res.data.ipWhitelist);
        setRateLimitInput(res.data.rateLimit);
      }
    });
  }, []);

  const handleUpdateIp = async () => {
    setSavingIp(true);
    const res = await updateAdminSecuritySettings({ ipWhitelist: ipInput });
    setSavingIp(false);
    if (res.error) return toast.error(res.error);
    if (res.data) setSecurity(res.data);
    toast.success('IP whitelist saved.');
  };

  const handleSessionTimeoutChange = async (value: string) => {
    const res = await updateAdminSecuritySettings({ sessionTimeout: value });
    if (res.error) return toast.error(res.error);
    if (res.data) setSecurity(res.data);
    toast.success('Session timeout preference saved.');
  };

  const handleSaveRateLimit = async () => {
    setSavingRate(true);
    const res = await updateAdminSecuritySettings({ rateLimit: rateLimitInput });
    setSavingRate(false);
    if (res.error) return toast.error(res.error);
    if (res.data) setSecurity(res.data);
    toast.success('Rate limit saved.');
  };

  const handleCopyKey = async () => {
    if (!security?.apiKey) return;
    await navigator.clipboard.writeText(security.apiKey);
    toast.success('API key copied to clipboard.');
  };

  const handleRegenerateKey = async () => {
    setRegenerating(true);
    const res = await regenerateAdminApiKey();
    setRegenerating(false);
    if (res.error) return toast.error(res.error);
    if (res.data) setSecurity(res.data);
    setKeyRevealed(false);
    toast.success('New API key generated. Update any integrations using the old key.');
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Settings" description="Admin roles, team management, security & platform configuration">
          <Button variant="outline" size="sm" className="border-border text-primary hover:bg-primary/10" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
        </PageHeader>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">Admin Roles</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!adminData ? (
              <SectionSkeleton rows={2} />
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button size="sm" disabled className="bg-primary/60 text-white h-8 text-xs cursor-not-allowed">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Admin
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Admin invite flow isn't wired up yet — coming soon.</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {!adminData ? (
              <SectionSkeleton rows={3} />
            ) : adminData.users.length === 0 ? (
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">Coming soon</Badge>
                    <Switch checked={false} disabled />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Two-factor authentication for admin accounts isn't implemented yet — this toggle is disabled rather than claiming a security control that doesn't exist.</TooltipContent>
              </Tooltip>
            </div>
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">IP Whitelist</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Restrict admin access to specific IP addresses</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={ipInput}
                    onChange={(e) => setIpInput(e.target.value)}
                    className="w-48 bg-muted border-border text-foreground text-sm h-9"
                  />
                  <Button
                    variant="outline" size="sm"
                    disabled={savingIp || !security}
                    onClick={handleUpdateIp}
                    className="border-border text-primary hover:bg-primary/10 h-9"
                  >
                    {savingIp ? 'Saving…' : 'Update'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Session Timeout</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Preferred idle timeout for admin sessions</p>
                </div>
                <Select value={security?.sessionTimeout || '1h'} onValueChange={handleSessionTimeoutChange} disabled={!security}>
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
              <SectionSkeleton rows={2} />
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
                    {!security ? 'Loading…' : keyRevealed ? security.apiKey : maskKey(security.apiKey)}
                  </code>
                  <Button
                    variant="ghost" size="icon" disabled={!security}
                    onClick={handleCopyKey}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" disabled={!security}
                    onClick={() => setKeyRevealed((v) => !v)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    {keyRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                variant="outline" size="sm" disabled={regenerating || !security}
                onClick={handleRegenerateKey}
                className="border-border text-primary hover:bg-primary/10 h-9 ml-4"
              >
                <Plus className="h-4 w-4 mr-1.5" /> {regenerating ? 'Generating…' : 'Generate New'}
              </Button>
            </div>
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Rate Limit</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={rateLimitInput}
                      onChange={(e) => setRateLimitInput(e.target.value)}
                      className="w-20 bg-muted border-border text-foreground text-sm h-9 text-center"
                    />
                    <span className="text-sm text-foreground/70">requests/min</span>
                    <Button
                      variant="outline" size="sm" disabled={savingRate || !security}
                      onClick={handleSaveRateLimit}
                      className="border-border text-primary hover:bg-primary/10 h-9"
                    >
                      {savingRate ? 'Saving…' : 'Save'}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full">
                      <Button disabled className="w-full bg-primary/50 text-white h-9 cursor-not-allowed">
                        <Download className="h-4 w-4 mr-1.5" /> Manual Backup
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Backup tooling isn't wired to a storage backend yet — coming soon.</TooltipContent>
                </Tooltip>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border flex items-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full">
                      <Button variant="outline" disabled className="w-full border-border text-accent/50 h-9 cursor-not-allowed">
                        <Upload className="h-4 w-4 mr-1.5" /> Restore
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Restore tooling isn't wired to a storage backend yet — coming soon.</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
