'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download, RefreshCw, Loader2, ScrollText, Search, ChevronDown, ChevronRight,
  AlertCircle, CheckCircle2, Clock, XCircle, ShoppingCart, Users,
  Building2, MessageSquare, CreditCard, UtensilsCrossed, Layers,
  DoorOpen, FileText, Package, Table as TableIcon, UserPlus, UserMinus,
  Settings, ArrowLeftRight, Tag, RotateCw, FileMinus,
} from 'lucide-react';
import { getLogs, LogEntry } from '@/lib/actions/logs';
import { downloadCsv } from '@/lib/superadmin-export';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

const actionTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  // Shifts
  SHIFT_OPEN:            { label: 'Shift Open',     color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <DoorOpen className="h-3 w-3" /> },
  SHIFT_CLOSE:           { label: 'Shift Close',    color: 'bg-slate-500/10 text-slate-600 border-slate-200',           icon: <DoorOpen className="h-3 w-3" /> },
  // Orders
  ORDER_CREATE:          { label: 'Order Created',  color: 'bg-blue-500/10 text-blue-600 border-blue-200',              icon: <ShoppingCart className="h-3 w-3" /> },
  ORDER_STATUS_UPDATE:   { label: 'Status Update',  color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',        icon: <RotateCw className="h-3 w-3" /> },
  ORDER_SETTLE:          { label: 'Order Settled',  color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <CheckCircle2 className="h-3 w-3" /> },
  ORDER_VOID:            { label: 'Order Voided',   color: 'bg-red-500/10 text-red-600 border-red-200',                 icon: <XCircle className="h-3 w-3" /> },
  ORDER_ITEM_VOID:       { label: 'Item Voided',    color: 'bg-red-500/10 text-red-600 border-red-200',                 icon: <XCircle className="h-3 w-3" /> },
  ORDER_SPLIT:           { label: 'Order Split',    color: 'bg-purple-500/10 text-purple-600 border-purple-200',        icon: <ArrowLeftRight className="h-3 w-3" /> },
  // Bills / Payments
  BILL_DRAFT:            { label: 'Bill Drafted',   color: 'bg-sky-500/10 text-sky-600 border-sky-200',                 icon: <FileText className="h-3 w-3" /> },
  BILL_COMPLETED:        { label: 'Bill Completed', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <CheckCircle2 className="h-3 w-3" /> },
  BILL_VOID:             { label: 'Bill Voided',    color: 'bg-red-500/10 text-red-600 border-red-200',                 icon: <XCircle className="h-3 w-3" /> },
  CREDIT_NOTE_ISSUE:     { label: 'Credit Note',    color: 'bg-orange-500/10 text-orange-600 border-orange-200',        icon: <FileMinus className="h-3 w-3" /> },
  BILL_HOLD:             { label: 'Bill On Hold',   color: 'bg-amber-500/10 text-amber-600 border-amber-200',           icon: <Clock className="h-3 w-3" /> },
  BILL_RESUME:           { label: 'Bill Resumed',   color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <RotateCw className="h-3 w-3" /> },
  BILL_SPLIT:            { label: 'Bill Split',     color: 'bg-purple-500/10 text-purple-600 border-purple-200',        icon: <ArrowLeftRight className="h-3 w-3" /> },
  PAYMENT_RECORD:        { label: 'Payment',        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <CreditCard className="h-3 w-3" /> },
  PAYMENT_VERIFIED:      { label: 'Payment Verified', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',   icon: <CreditCard className="h-3 w-3" /> },
  DISCOUNT_APPLY:        { label: 'Discount',       color: 'bg-amber-500/10 text-amber-600 border-amber-200',           icon: <Tag className="h-3 w-3" /> },
  COUPON_APPLY:          { label: 'Coupon Applied', color: 'bg-violet-500/10 text-violet-600 border-violet-200',        icon: <Tag className="h-3 w-3" /> },
  CASH_DRAWER_POP:       { label: 'Cash Drawer',    color: 'bg-amber-500/10 text-amber-600 border-amber-200',           icon: <CreditCard className="h-3 w-3" /> },
  CORPORATE_BILL:        { label: 'Corporate Bill', color: 'bg-teal-500/10 text-teal-600 border-teal-200',              icon: <Building2 className="h-3 w-3" /> },
  // Reservations
  RESERVATION_CREATE:    { label: 'Reservation',    color: 'bg-blue-500/10 text-blue-600 border-blue-200',              icon: <Users className="h-3 w-3" /> },
  RESERVATION_CHECKIN:   { label: 'Check-In',       color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <UserPlus className="h-3 w-3" /> },
  RESERVATION_CANCEL:    { label: 'Cancellation',   color: 'bg-red-500/10 text-red-600 border-red-200',                 icon: <UserMinus className="h-3 w-3" /> },
  RESERVATION_UPDATE:    { label: 'Res. Updated',   color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',        icon: <Users className="h-3 w-3" /> },
  // Walk-in / Waitlist
  WALK_IN_ASSIGN:        { label: 'Walk-In',        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <UserPlus className="h-3 w-3" /> },
  WAITLIST_ADD:          { label: 'Waitlisted',     color: 'bg-amber-500/10 text-amber-600 border-amber-200',           icon: <Clock className="h-3 w-3" /> },
  WAITLIST_NOTIFY:       { label: 'Notified',       color: 'bg-blue-500/10 text-blue-600 border-blue-200',              icon: <MessageSquare className="h-3 w-3" /> },
  WAITLIST_SEAT:         { label: 'Waitlist Seated', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',    icon: <UserPlus className="h-3 w-3" /> },
  WAITLIST_REMOVE:       { label: 'Waitlist Removed', color: 'bg-red-500/10 text-red-600 border-red-200',               icon: <UserMinus className="h-3 w-3" /> },
  // Tables / Floor
  TABLE_MERGE:           { label: 'Tables Merged',  color: 'bg-purple-500/10 text-purple-600 border-purple-200',        icon: <Layers className="h-3 w-3" /> },
  TABLE_ADD:             { label: 'Table Added',    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <TableIcon className="h-3 w-3" /> },
  TABLE_STATUS_UPDATE:   { label: 'Table Updated',  color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',        icon: <TableIcon className="h-3 w-3" /> },
  TABLE_POSITION_UPDATE: { label: 'Table Moved',    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',        icon: <TableIcon className="h-3 w-3" /> },
  TABLE_DELETE:          { label: 'Table Deleted',  color: 'bg-red-500/10 text-red-600 border-red-200',                 icon: <TableIcon className="h-3 w-3" /> },
  FLOOR_ADD:             { label: 'Floor Added',    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <Layers className="h-3 w-3" /> },
  FLOOR_RENAME:          { label: 'Floor Renamed',  color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',        icon: <Layers className="h-3 w-3" /> },
  FLOOR_DELETE:          { label: 'Floor Deleted',  color: 'bg-red-500/10 text-red-600 border-red-200',                 icon: <Layers className="h-3 w-3" /> },
  // Menu
  MENU_ITEM_CREATED:     { label: 'Menu Item Added', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',    icon: <UtensilsCrossed className="h-3 w-3" /> },
  MENU_ITEM_UPDATED:     { label: 'Menu Item Updated', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',     icon: <UtensilsCrossed className="h-3 w-3" /> },
  MENU_ITEM_DELETED:     { label: 'Menu Item Removed', color: 'bg-red-500/10 text-red-600 border-red-200',              icon: <UtensilsCrossed className="h-3 w-3" /> },
  // Inventory
  INVENTORY_ADD:           { label: 'Item Added',     color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',    icon: <Package className="h-3 w-3" /> },
  INVENTORY_STOCK_UPDATE:  { label: 'Stock Updated',  color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',      icon: <Package className="h-3 w-3" /> },
  INVENTORY_STOCK_ADD:     { label: 'Stock Added',    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',   icon: <Package className="h-3 w-3" /> },
  INVENTORY_USAGE:         { label: 'Stock Used',     color: 'bg-amber-500/10 text-amber-600 border-amber-200',         icon: <Package className="h-3 w-3" /> },
  // Staff
  STAFF_CREATED:         { label: 'Staff Added',    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <UserPlus className="h-3 w-3" /> },
  STAFF_UPDATED:         { label: 'Staff Updated',  color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',        icon: <Users className="h-3 w-3" /> },
  STAFF_DELETED:         { label: 'Staff Removed',  color: 'bg-red-500/10 text-red-600 border-red-200',                 icon: <UserMinus className="h-3 w-3" /> },
  // CRM / Customers
  CUSTOMER_CREATE:       { label: 'Customer Added', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',     icon: <UserPlus className="h-3 w-3" /> },
  CUSTOMER_UPDATE:       { label: 'Customer Updated', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',      icon: <Users className="h-3 w-3" /> },
  CUSTOMER_DELETE:       { label: 'Customer Removed', color: 'bg-red-500/10 text-red-600 border-red-200',               icon: <UserMinus className="h-3 w-3" /> },
  CUSTOMER_TAG:          { label: 'Customer Tagged', color: 'bg-violet-500/10 text-violet-600 border-violet-200',       icon: <Tag className="h-3 w-3" /> },
  CUSTOMER_IMPORT:       { label: 'Customers Imported', color: 'bg-blue-500/10 text-blue-600 border-blue-200',          icon: <Users className="h-3 w-3" /> },
  // Settings / Misc
  SETTINGS_UPDATE:       { label: 'Settings Changed', color: 'bg-slate-500/10 text-slate-600 border-slate-200',         icon: <Settings className="h-3 w-3" /> },
};

function formatActionType(action: string): string {
  return actionTypeConfig[action]?.label || action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEntityType(entity: string): string {
  if (!entity) return '-';
  return entity.replace(/([A-Z])/g, ' $1').trim();
}

function isChanged(changes: Record<string, unknown> | null): boolean {
  return changes !== null && Object.keys(changes).length > 0;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const tab = TABS.find((t) => t.value === activeTab);
    let filtered = logs;
    if (tab && tab.roles.length > 0) {
      filtered = filtered.filter((log) => tab.roles.includes(log.userRole));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((log) =>
        log.userName.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        formatActionType(log.actionType).toLowerCase().includes(q) ||
        formatEntityType(log.entityType).toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [logs, activeTab, searchQuery]);

  const stats = useMemo(() => {
    const todayLogs = filteredLogs.filter((log) => {
      const d = new Date(log.createdAt);
      return d.toDateString() === new Date().toDateString();
    }).length;
    return { total: filteredLogs.length, todayLogs };
  }, [filteredLogs]);

  const handleExport = () => {
    if (filteredLogs.length === 0) { toast.error('No logs to export'); return; }
    const rows: string[][] = [['Date', 'Time', 'User', 'Role', 'Action', 'Entity', 'Description']];
    for (const log of filteredLogs) {
      const d = new Date(log.createdAt);
      rows.push([format(d, 'yyyy-MM-dd'), format(d, 'HH:mm:ss'), log.userName, log.userRole, formatActionType(log.actionType), formatEntityType(log.entityType), log.description]);
    }
    const tabLabel = activeTab === 'all' ? 'all' : activeTab;
    downloadCsv(`logs-${tabLabel}-${period}`, rows);
    toast.success('Logs exported');
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      RECEPTIONIST: 'bg-sky-500/10 text-sky-600 border-sky-200',
      WAITER: 'bg-blue-500/10 text-blue-600 border-blue-200',
      RESTAURANT_OWNER: 'bg-amber-500/10 text-amber-600 border-amber-200',
      MANAGER: 'bg-violet-500/10 text-violet-600 border-violet-200',
      STAFF: 'bg-slate-500/10 text-slate-600 border-slate-200',
      SUPERADMIN: 'bg-red-500/10 text-red-600 border-red-200',
    };
    return <Badge variant="outline" className={cn('text-[10px] font-medium', colors[role] || 'bg-muted/50')}>{role.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Every action across your restaurant — shifts, orders, payments, menu changes and more
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
                <TabsList>
                  {TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                      {tab.label}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tab.value === 'all'
                          ? logs.length
                          : logs.filter((l) => tab.roles.includes(l.userRole)).length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex gap-1 flex-wrap">
                {PERIODS.map((p) => (
                  <Button
                    key={p.value}
                    variant={period === p.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod(p.value)}
                    className="text-xs"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted border-border text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Logs</CardTitle>
            <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{PERIODS.find((p) => p.value === period)?.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today</CardTitle>
            <AlertCircle className="h-3.5 w-3.5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.todayLogs}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Actions today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Orders</CardTitle>
            <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-500">
              {filteredLogs.filter((l) => l.actionType.startsWith('ORDER_') || l.actionType.startsWith('BILL_')).length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Order & bill actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Payments</CardTitle>
            <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-500">
              {filteredLogs.filter((l) => l.actionType.includes('PAYMENT')).length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Payment transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {TABS.find((t) => t.value === activeTab)?.label} Logs
              </CardTitle>
              <CardDescription>
                {filteredLogs.length} entr{filteredLogs.length === 1 ? 'y' : 'ies'}
                {searchQuery && ` matching "${searchQuery}"`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No logs found</p>
              <p className="text-xs mt-1">
                {searchQuery
                  ? 'Try a different search term'
                  : `No activity recorded ${PERIODS.find((p) => p.value === period)?.label.toLowerCase()}`}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[150px] text-xs font-medium">Date & Time</TableHead>
                    <TableHead className="w-[130px] text-xs font-medium">User</TableHead>
                    <TableHead className="w-[100px] text-xs font-medium">Role</TableHead>
                    <TableHead className="w-[140px] text-xs font-medium">Action</TableHead>
                    <TableHead className="w-[90px] text-xs font-medium">Entity</TableHead>
                    <TableHead className="text-xs font-medium">Description</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const d = new Date(log.createdAt);
                    const config = actionTypeConfig[log.actionType];
                    const hasChanges = isChanged(log.changesBefore) || isChanged(log.changesAfter);
                    const isExpanded = expandedRow === log.id;
                    return (
                      <>
                        <TableRow
                          key={log.id}
                          className={cn(
                            'group cursor-pointer transition-colors',
                            isExpanded && 'bg-muted/40'
                          )}
                          onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                        >
                          <TableCell className="whitespace-nowrap text-xs">
                            <div className="font-medium text-foreground">{format(d, 'MMM d, yyyy')}</div>
                            <div className="text-muted-foreground">{format(d, 'hh:mm:ss a')}</div>
                          </TableCell>
                          <TableCell className="font-medium text-sm whitespace-nowrap">
                            {log.userName}
                          </TableCell>
                          <TableCell>{roleBadge(log.userRole)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('gap-1 text-[10px] font-medium', config?.color || 'bg-muted/50')}>
                              {config?.icon}
                              {formatActionType(log.actionType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatEntityType(log.entityType)}
                          </TableCell>
                          <TableCell className="text-sm max-w-[260px]">
                            <span className="line-clamp-2">{log.description}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {hasChanges && (
                              <span className="inline-flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && hasChanges && (
                          <TableRow key={`${log.id}-details`} className="bg-muted/20">
                            <TableCell colSpan={7} className="p-0">
                              <div className="px-6 py-3 space-y-2 text-xs border-t border-border">
                                {isChanged(log.changesBefore) && (
                                  <div>
                                    <p className="font-medium text-muted-foreground mb-1">Before</p>
                                    <pre className="bg-muted/50 rounded p-2 text-[11px] overflow-x-auto max-h-32">
                                      {JSON.stringify(log.changesBefore, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {isChanged(log.changesAfter) && (
                                  <div>
                                    <p className="font-medium text-muted-foreground mb-1">After</p>
                                    <pre className="bg-muted/50 rounded p-2 text-[11px] overflow-x-auto max-h-32">
                                      {JSON.stringify(log.changesAfter, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
