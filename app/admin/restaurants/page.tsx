'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search, Filter, MoreHorizontal, Eye, Ban, ArrowUpCircle,
  Download, Mail, CheckCircle, XCircle, Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatNumber, formatDate } from '@/lib/format';

interface Restaurant {
  id: number;
  name: string;
  city: string;
  owner: string;
  plan: string;
  status: string;
  paymentStatus: string;
  tables: number;
  revenue: number;
  orders: number;
  staff: number;
  health: number;
  joined: string;
  lastActive: string;
}

const PlanBadge = ({ plan }: { plan: string }) => {
  const colors: Record<string, string> = {
    Enterprise: 'bg-accent/10 text-accent border-accent/30',
    Pro: 'bg-primary/10 text-primary border-primary/30',
    Basic: 'bg-info/10 text-info border-info/30',
    Free: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  };
  return <Badge className={`border ${colors[plan] || colors.Free}`}>{plan}</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Active: 'bg-primary/10 text-primary border-primary/30',
    Trial: 'bg-accent/10 text-accent border-accent/30',
    Suspended: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  return <Badge className={`border ${colors[status] || colors.Active}`}>{status}</Badge>;
};

export default function AdminRestaurants() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<number[]>([]);

  const filtered: Restaurant[] = [];

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((r) => r.id));
  };

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Restaurant Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all restaurants on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, owner, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[130px] bg-muted border-border text-foreground h-9 text-sm">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all" className="text-foreground">All Plans</SelectItem>
                <SelectItem value="Enterprise" className="text-foreground">Enterprise</SelectItem>
                <SelectItem value="Pro" className="text-foreground">Pro</SelectItem>
                <SelectItem value="Basic" className="text-foreground">Basic</SelectItem>
                <SelectItem value="Free" className="text-foreground">Free</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] bg-muted border-border text-foreground h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all" className="text-foreground">All Status</SelectItem>
                <SelectItem value="Active" className="text-foreground">Active</SelectItem>
                <SelectItem value="Trial" className="text-foreground">Trial</SelectItem>
                <SelectItem value="Suspended" className="text-foreground">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Filter className="h-4 w-4 text-muted-foreground" />
            {selected.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-foreground">
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Suspend
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:text-foreground">
                  <Mail className="h-3.5 w-3.5 mr-1" /> Notify
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-accent hover:text-foreground">
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1" /> Upgrade
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="accent-[hsl(var(--primary))]"
                  />
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Tables</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Revenue</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Orders</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-center">Health</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Payment</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Last Active</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-border hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggle(r.id)}
                      className="accent-[hsl(var(--primary))]"
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/restaurants/${r.id}`}>
                      <div className="cursor-pointer hover:text-primary transition-colors">
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.city} · {r.owner}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell><PlanBadge plan={r.plan} /></TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right text-foreground/70 text-sm">{r.tables}</TableCell>
                  <TableCell className="text-right text-foreground/70 text-sm">{formatCurrency(r.revenue)}</TableCell>
                  <TableCell className="text-right text-foreground/70 text-sm">{formatNumber(r.orders)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.health >= 80 ? 'bg-primary' : r.health >= 50 ? 'bg-accent' : 'bg-destructive'
                          }`}
                          style={{ width: `${r.health}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        r.health >= 80 ? 'text-primary' : r.health >= 50 ? 'text-accent' : 'text-destructive'
                      }`}>{r.health}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={`border text-[10px] ${
                      r.paymentStatus === 'Paid' ? 'bg-primary/10 text-primary border-primary/30'
                        : r.paymentStatus === 'Pending' ? 'bg-accent/10 text-accent border-accent/30'
                        : r.paymentStatus === 'Overdue' ? 'bg-destructive/10 text-destructive border-destructive/30'
                        : 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30'
                    }`}>{r.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.lastActive}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
