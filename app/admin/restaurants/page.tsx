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

const restaurants: Restaurant[] = [
  { id: 1, name: 'Himalayan Kitchen', city: 'Kathmandu', owner: 'Ramesh Poudel', plan: 'Pro', status: 'Active', paymentStatus: 'Paid', tables: 24, revenue: 125000, orders: 520, staff: 8, health: 92, joined: '2024-01-15', lastActive: '2024-07-15' },
  { id: 2, name: 'Thakali House', city: 'Pokhara', owner: 'Bhim Magar', plan: 'Enterprise', status: 'Active', paymentStatus: 'Paid', tables: 42, revenue: 285000, orders: 980, staff: 15, health: 96, joined: '2023-08-20', lastActive: '2024-07-15' },
  { id: 3, name: 'Newari Delights', city: 'Kathmandu', owner: 'Priya Shakya', plan: 'Basic', status: 'Active', paymentStatus: 'Paid', tables: 12, revenue: 45000, orders: 185, staff: 5, health: 78, joined: '2024-03-10', lastActive: '2024-07-14' },
  { id: 4, name: 'Kathmandu Cafe', city: 'Kathmandu', owner: 'Anish Sharma', plan: 'Free', status: 'Trial', paymentStatus: 'N/A', tables: 8, revenue: 15000, orders: 62, staff: 3, health: 55, joined: '2024-06-01', lastActive: '2024-07-12' },
  { id: 5, name: 'Pokhara Grill', city: 'Pokhara', owner: 'Deepak Ale', plan: 'Pro', status: 'Active', paymentStatus: 'Paid', tables: 30, revenue: 185000, orders: 745, staff: 12, health: 88, joined: '2023-11-05', lastActive: '2024-07-15' },
  { id: 6, name: 'Nuwakot Dining', city: 'Bhaktapur', owner: 'Sunita Tamang', plan: 'Basic', status: 'Suspended', paymentStatus: 'Overdue', tables: 15, revenue: 0, orders: 0, staff: 4, health: 18, joined: '2024-02-14', lastActive: '2024-06-20' },
  { id: 7, name: 'Langtang Lodge', city: 'Kathmandu', owner: 'Tenzin Sherpa', plan: 'Enterprise', status: 'Active', paymentStatus: 'Paid', tables: 50, revenue: 325000, orders: 1240, staff: 22, health: 98, joined: '2023-05-22', lastActive: '2024-07-15' },
  { id: 8, name: 'Dhulikhel Traditional', city: 'Dhulikhel', owner: 'Maya Rai', plan: 'Pro', status: 'Active', paymentStatus: 'Pending', tables: 18, revenue: 95000, orders: 380, staff: 7, health: 72, joined: '2024-01-28', lastActive: '2024-07-14' },
  { id: 9, name: 'Ilam Coffee & Kitchen', city: 'Ilam', owner: 'Harish Limbu', plan: 'Basic', status: 'Active', paymentStatus: 'Paid', tables: 10, revenue: 35000, orders: 140, staff: 4, health: 45, joined: '2024-04-16', lastActive: '2024-07-10' },
  { id: 10, name: 'Chitwan Wildlife Cafe', city: 'Chitwan', owner: 'Govind Thapa', plan: 'Pro', status: 'Active', paymentStatus: 'Paid', tables: 28, revenue: 165000, orders: 620, staff: 10, health: 85, joined: '2023-10-08', lastActive: '2024-07-15' },
  { id: 11, name: 'Sagarmatha Palace', city: 'Pokhara', owner: 'Sonam Sherpa', plan: 'Basic', status: 'Active', paymentStatus: 'Paid', tables: 16, revenue: 52000, orders: 210, staff: 6, health: 70, joined: '2024-07-01', lastActive: '2024-07-14' },
  { id: 12, name: 'Rara Valley Kitchen', city: 'Kathmandu', owner: 'Ujjwal Prasad', plan: 'Free', status: 'Trial', paymentStatus: 'N/A', tables: 6, revenue: 8000, orders: 35, staff: 2, health: 40, joined: '2024-07-05', lastActive: '2024-07-13' },
];

const PlanBadge = ({ plan }: { plan: string }) => {
  const colors: Record<string, string> = {
    Enterprise: 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
    Pro: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    Basic: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30',
    Free: 'bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30',
  };
  return <Badge className={`border ${colors[plan] || colors.Free}`}>{plan}</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Active: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    Trial: 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
    Suspended: 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30',
  };
  return <Badge className={`border ${colors[status] || colors.Active}`}>{status}</Badge>;
};

export default function AdminRestaurants() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<number[]>([]);

  const filtered = restaurants.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.owner.toLowerCase().includes(search.toLowerCase()) || r.city.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || r.plan === planFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Restaurant Management</h1>
          <p className="text-sm text-[#768B80] mt-1">Manage all {restaurants.length} restaurants on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-[#25332B] text-[#768B80] hover:text-white">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#768B80]" />
              <Input
                placeholder="Search by name, owner, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#1A231E] border-[#25332B] text-white placeholder:text-[#768B80] text-sm h-9"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[130px] bg-[#1A231E] border-[#25332B] text-white h-9 text-sm">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1711] border-[#25332B]">
                <SelectItem value="all" className="text-white">All Plans</SelectItem>
                <SelectItem value="Enterprise" className="text-white">Enterprise</SelectItem>
                <SelectItem value="Pro" className="text-white">Pro</SelectItem>
                <SelectItem value="Basic" className="text-white">Basic</SelectItem>
                <SelectItem value="Free" className="text-white">Free</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] bg-[#1A231E] border-[#25332B] text-white h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1711] border-[#25332B]">
                <SelectItem value="all" className="text-white">All Status</SelectItem>
                <SelectItem value="Active" className="text-white">Active</SelectItem>
                <SelectItem value="Trial" className="text-white">Trial</SelectItem>
                <SelectItem value="Suspended" className="text-white">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Filter className="h-4 w-4 text-[#768B80]" />
            {selected.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-[#768B80]">{selected.length} selected</span>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-[#DB3A3A] hover:text-white">
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Suspend
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-[#12B877] hover:text-white">
                  <Mail className="h-3.5 w-3.5 mr-1" /> Notify
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-[#F4B740] hover:text-white">
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1" /> Upgrade
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="accent-[#12B877]"
                  />
                </TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Tables</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Revenue</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Orders</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-center">Health</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Payment</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Last Active</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggle(r.id)}
                      className="accent-[#12B877]"
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/restaurants/${r.id}`}>
                      <div className="cursor-pointer hover:text-[#12B877] transition-colors">
                        <p className="text-sm font-medium text-white">{r.name}</p>
                        <p className="text-xs text-[#768B80]">{r.city} · {r.owner}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell><PlanBadge plan={r.plan} /></TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right text-white/70 text-sm">{r.tables}</TableCell>
                  <TableCell className="text-right text-white/70 text-sm">{formatCurrency(r.revenue)}</TableCell>
                  <TableCell className="text-right text-white/70 text-sm">{formatNumber(r.orders)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-16 h-1.5 rounded-full bg-[#1A231E] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.health >= 80 ? 'bg-[#12B877]' : r.health >= 50 ? 'bg-[#F4B740]' : 'bg-[#DB3A3A]'
                          }`}
                          style={{ width: `${r.health}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        r.health >= 80 ? 'text-[#12B877]' : r.health >= 50 ? 'text-[#F4B740]' : 'text-[#DB3A3A]'
                      }`}>{r.health}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={`border text-[10px] ${
                      r.paymentStatus === 'Paid' ? 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30'
                        : r.paymentStatus === 'Pending' ? 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30'
                        : r.paymentStatus === 'Overdue' ? 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30'
                        : 'bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30'
                    }`}>{r.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#768B80]">{r.lastActive}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#768B80] hover:text-white">
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
