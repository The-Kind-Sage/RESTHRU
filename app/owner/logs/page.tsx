'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, RefreshCw, Loader2, ScrollText } from 'lucide-react';
import { getLogs, LogEntry } from '@/lib/actions/logs';
import { downloadCsv } from '@/lib/superadmin-export';
import { format } from 'date-fns';
import { toast } from 'sonner';

type Tab = 'all' | 'reception' | 'waiter' | 'admin';

const TABS: { value: Tab; label: string; roles: string[] }[] = [
  { value: 'all', label: 'All Users', roles: [] },
  { value: 'reception', label: 'Reception', roles: ['RECEPTIONIST'] },
  { value: 'waiter', label: 'Waiter', roles: ['WAITER'] },
  { value: 'admin', label: 'Admin', roles: ['RESTAURANT_OWNER', 'MANAGER', 'STAFF', 'ADMIN'] },
];

const PERIODS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

const actionTypeColors: Record<string, string> = {
  SHIFT_OPEN: 'bg-success/10 text-success',
  SHIFT_CLOSE: 'bg-muted-foreground/10 text-muted-foreground',
  ORDER_VOID: 'bg-destructive/10 text-destructive',
  ORDER_ITEM_VOID: 'bg-destructive/10 text-destructive',
  CASH_DRAWER_POP: 'bg-warning/10 text-warning',
  PAYMENT: 'bg-success/10 text-success',
};

function formatActionType(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEntityType(entity: string): string {
  return entity.replace(/([A-Z])/g, ' $1').trim();
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    const result = await getLogs(period);
    if (result.error) {
      toast.error(result.error);
    } else {
      setLogs(result.data);
    }
    setIsLoading(false);
  }, [period]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const tab = TABS.find((t) => t.value === activeTab);
    if (!tab || tab.roles.length === 0) return logs;
    return logs.filter((log) => tab.roles.includes(log.userRole));
  }, [logs, activeTab]);

  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const todayLogs = filteredLogs.filter((log) => {
      const d = new Date(log.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    return { total, todayLogs };
  }, [filteredLogs]);

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }
    const rows: string[][] = [
      ['Date', 'Time', 'User', 'Role', 'Action', 'Entity', 'Description'],
    ];
    for (const log of filteredLogs) {
      const d = new Date(log.createdAt);
      rows.push([
        format(d, 'yyyy-MM-dd'),
        format(d, 'HH:mm:ss'),
        log.userName,
        log.userRole,
        formatActionType(log.actionType),
        formatEntityType(log.entityType),
        log.description,
      ]);
    }
    const tabLabel = activeTab === 'all' ? 'all' : activeTab;
    downloadCsv(`logs-${tabLabel}-${period}`, rows);
    toast.success('Logs exported');
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      RECEPTIONIST: 'bg-info/10 text-info',
      WAITER: 'bg-primary/10 text-primary',
      RESTAURANT_OWNER: 'bg-warning/10 text-warning',
      MANAGER: 'bg-primary/10 text-primary',
      STAFF: 'bg-muted-foreground/10 text-muted-foreground',
      ADMIN: 'bg-destructive/10 text-destructive',
    };
    return (
      <Badge className={colors[role] || 'bg-muted-foreground/10 text-muted-foreground'}>
        {role.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all changes and actions across your system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex gap-1 flex-wrap">
              {TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeTab === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                  {activeTab === tab.value && (
                    <Badge className="ml-2 bg-white/20 text-white" variant="default">
                      {tab.value === 'all'
                        ? logs.length
                        : logs.filter((l) => tab.roles.includes(l.userRole)).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Period filter */}
            <div className="flex gap-1 flex-wrap">
              {PERIODS.map((p) => (
                <Button
                  key={p.value}
                  variant={period === p.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {PERIODS.find((p) => p.value === period)?.label}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <ScrollText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.todayLogs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Actions recorded today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {TABS.find((t) => t.value === activeTab)?.label} Logs
          </CardTitle>
          <CardDescription>
            {filteredLogs.length} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No logs found for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Date & Time</TableHead>
                    <TableHead className="w-[140px]">User</TableHead>
                    <TableHead className="w-[110px]">Role</TableHead>
                    <TableHead className="w-[140px]">Action</TableHead>
                    <TableHead className="w-[110px]">Entity</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const d = new Date(log.createdAt);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div>{format(d, 'MMM d, yyyy')}</div>
                          <div className="text-muted-foreground text-xs">{format(d, 'HH:mm:ss')}</div>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {log.userName}
                        </TableCell>
                        <TableCell>{roleBadge(log.userRole)}</TableCell>
                        <TableCell>
                          <Badge className={actionTypeColors[log.actionType] || 'bg-muted/50'}>
                            {formatActionType(log.actionType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatEntityType(log.entityType)}
                        </TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">
                          {log.description}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
