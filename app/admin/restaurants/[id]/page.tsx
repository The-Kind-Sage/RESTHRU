'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Clock, Shield,
  User, Users, QrCode, CreditCard, Headphones, FileText,
  Activity, AlertTriangle, ChevronDown, Download, Search,
  MoreHorizontal, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';

const restaurant = {
  id: '1',
  name: 'Himalayan Kitchen',
  owner: 'Ramesh Poudel',
  email: 'ramesh@himalayankitchen.com',
  phone: '+977-9841234567',
  address: 'Thamel, Kathmandu 44600',
  pan: '302145678',
  vat: '4021456789',
  plan: 'Pro',
  status: 'Active',
  health: 92,
  joined: '2024-01-15',
  lastActive: '2024-07-15',
  staff: 8,
  tables: 24,
  revenue: 125000,
  orders: 520,
  satisfaction: 4.5,
  documents: ['Business Registration.pdf', 'PAN Certificate.pdf', 'VAT Certificate.pdf', 'Ownership Proof.pdf'],
};

const staffData = [
  { name: 'Ramesh Poudel', role: 'Owner', email: 'ramesh@hk.com', phone: '+977-9841234567', active: true },
  { name: 'Sita Poudel', role: 'Manager', email: 'sita@hk.com', phone: '+977-9857654321', active: true },
  { name: 'Krishna Thapa', role: 'Chef', email: 'krishna@hk.com', phone: '+977-9861112233', active: true },
  { name: 'Anita Rai', role: 'Waiter', email: 'anita@hk.com', phone: '+977-9849988776', active: false },
];

const orderHistory = [
  { id: 'ORD-1001', customer: 'John Doe', items: 3, total: 2450, status: 'Completed', time: '2 hours ago' },
  { id: 'ORD-1002', customer: 'Sarah Smith', items: 2, total: 1800, status: 'Completed', time: '3 hours ago' },
  { id: 'ORD-1003', customer: 'Mike Brown', items: 5, total: 4200, status: 'Processing', time: '30 min ago' },
  { id: 'ORD-1004', customer: 'Emily Davis', items: 1, total: 650, status: 'Pending', time: '5 min ago' },
  { id: 'ORD-1005', customer: 'Raj Kumar', items: 4, total: 3200, status: 'Completed', time: '1 day ago' },
];

const payments = [
  { id: 'INV-2024-001', amount: 45000, status: 'Paid', method: 'eSewa', date: '2024-07-01', due: '2024-07-05' },
  { id: 'INV-2024-002', amount: 45000, status: 'Paid', method: 'Bank Transfer', date: '2024-06-01', due: '2024-06-05' },
  { id: 'INV-2024-003', amount: 45000, status: 'Overdue', method: 'Khalti', date: '2024-05-01', due: '2024-05-05' },
  { id: 'INV-2024-004', amount: 35000, status: 'Paid', method: 'eSewa', date: '2024-04-01', due: '2024-04-05' },
];

const supportTickets = [
  { id: 'TKT-001', subject: 'POS sync failure', status: 'Open', priority: 'High', created: '2024-07-14', assignee: 'Support Team A' },
  { id: 'TKT-002', subject: 'Menu not updating', status: 'Resolved', priority: 'Medium', created: '2024-07-10', assignee: 'Support Team B' },
  { id: 'TKT-003', subject: 'Payment gateway error', status: 'Closed', priority: 'Low', created: '2024-07-05', assignee: 'Support Team A' },
];

export default function RestaurantDetail() {
  const params = useParams();
  const [impersonating, setImpersonating] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/restaurants">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#768B80] hover:text-white hover:bg-[#1A231E]">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{restaurant.name}</h1>
              <Badge className="bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30">{restaurant.plan}</Badge>
              <Badge className="bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30">{restaurant.status}</Badge>
            </div>
            <p className="text-sm text-[#768B80] mt-1">Restaurant ID: {params.id} · Member since {formatDate(restaurant.joined)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={impersonating ? 'default' : 'outline'}
            size="sm"
            className={impersonating
              ? 'bg-[#F4B740] text-black hover:bg-[#F4B740]/90'
              : 'border-[#25332B] text-[#768B80] hover:text-white'
            }
            onClick={() => setImpersonating(!impersonating)}
          >
            <Shield className="h-4 w-4 mr-1.5" />
            {impersonating ? 'Stop Impersonating' : 'Impersonate'}
          </Button>
          <Button variant="outline" size="sm" className="border-[#DB3A3A]/30 text-[#DB3A3A] hover:bg-[#DB3A3A]/10">
            <XCircle className="h-4 w-4 mr-1.5" /> Suspend
          </Button>
        </div>
      </div>

      {impersonating && (
        <div className="bg-[#F4B740]/10 border border-[#F4B740]/30 rounded-lg px-4 py-3 flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#F4B740]" />
          <p className="text-sm text-[#F4B740]">You are viewing this restaurant as <strong>Ramesh Poudel</strong>. All actions are logged.</p>
        </div>
      )}

      {/* Owner Info + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 rounded-xl bg-[#1A231E]">
                <AvatarFallback className="bg-gradient-to-br from-[#12B877] to-[#0E945E] text-white text-xl font-bold rounded-xl">RP</AvatarFallback>
              </Avatar>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#768B80] uppercase tracking-wider mb-1">Owner</p>
                  <p className="text-sm font-medium text-white">{restaurant.owner}</p>
                </div>
                <div>
                  <p className="text-xs text-[#768B80] uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-[#768B80]">{restaurant.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#768B80] uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-sm text-[#768B80]">{restaurant.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-[#768B80] uppercase tracking-wider mb-1">PAN</p>
                  <p className="text-sm font-mono text-white">{restaurant.pan}</p>
                </div>
                <div>
                  <p className="text-xs text-[#768B80] uppercase tracking-wider mb-1">VAT</p>
                  <p className="text-sm font-mono text-white">{restaurant.vat}</p>
                </div>
                <div>
                  <p className="text-xs text-[#768B80] uppercase tracking-wider mb-1">Address</p>
                  <p className="text-sm text-[#768B80]">{restaurant.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardContent className="p-6">
            <p className="text-xs text-[#768B80] uppercase tracking-wider mb-3">Health Score</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1A231E" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#12B877" strokeWidth="3"
                    strokeDasharray={`${restaurant.health * 0.97} 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">{restaurant.health}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Excellent</p>
                <p className="text-xs text-[#768B80]">All systems operational</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#768B80]">Staff</span>
                <span className="text-white">{restaurant.staff}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#768B80]">Tables</span>
                <span className="text-white">{restaurant.tables}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#768B80]">Satisfaction</span>
                <span className="text-white">{restaurant.satisfaction}/5.0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#768B80]">Last Active</span>
                <span className="text-white">{restaurant.lastActive}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-[#1A231E] border border-[#25332B] w-full justify-start overflow-auto flex-nowrap h-auto p-1 gap-0">
          {['orders', 'payments', 'staff', 'tables', 'subscription', 'tickets', 'documents', 'audit'].map((tab) => (
            <TabsTrigger key={tab} value={tab}
              className="text-xs px-4 py-2 text-[#768B80] data-[state=active]:bg-[#12B877]/10 data-[state=active]:text-[#12B877] data-[state=active]:shadow-none rounded-md capitalize whitespace-nowrap"
            >
              {tab === 'subscription' ? 'Subscription' : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Order History</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#768B80]" />
                  <Input placeholder="Search orders..." className="pl-8 h-8 w-48 bg-[#1A231E] border-[#25332B] text-white placeholder:text-[#768B80] text-xs" />
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-[#768B80]">
                  <Download className="h-3.5 w-3.5 mr-1" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#25332B]">
                    <TableHead className="text-[#768B80] text-xs">Order</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Customer</TableHead>
                    <TableHead className="text-[#768B80] text-xs text-right">Items</TableHead>
                    <TableHead className="text-[#768B80] text-xs text-right">Total</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Status</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderHistory.map((o) => (
                    <TableRow key={o.id} className="border-[#25332B]">
                      <TableCell className="text-sm text-white font-medium">{o.id}</TableCell>
                      <TableCell className="text-sm text-[#768B80]">{o.customer}</TableCell>
                      <TableCell className="text-sm text-white/70 text-right">{o.items}</TableCell>
                      <TableCell className="text-sm text-white/70 text-right">{formatCurrency(o.total)}</TableCell>
                      <TableCell>
                        <Badge className={`border text-[10px] ${
                          o.status === 'Completed' ? 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30'
                            : o.status === 'Processing' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'
                            : 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30'
                        }`}>{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[#768B80]">{o.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-4">
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Payment History</CardTitle>
              <Button variant="outline" size="sm" className="h-8 text-xs border-[#25332B] text-[#768B80]">
                <CreditCard className="h-3.5 w-3.5 mr-1" /> Process Refund
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#25332B]">
                    <TableHead className="text-[#768B80] text-xs">Invoice</TableHead>
                    <TableHead className="text-[#768B80] text-xs text-right">Amount</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Method</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Status</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Date</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className="border-[#25332B]">
                      <TableCell className="text-sm text-white font-medium">{p.id}</TableCell>
                      <TableCell className="text-sm text-white/70 text-right">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-sm text-[#768B80]">{p.method}</TableCell>
                      <TableCell>
                        <Badge className={`border text-[10px] ${
                          p.status === 'Paid' ? 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30'
                            : 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30'
                        }`}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[#768B80]">{formatDate(p.date)}</TableCell>
                      <TableCell className="text-xs text-[#768B80]">{formatDate(p.due)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="mt-4">
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Staff Members</CardTitle>
              <Badge className="bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30">{restaurant.staff} total</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#25332B]">
                    <TableHead className="text-[#768B80] text-xs">Name</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Role</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Email</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Phone</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffData.map((s) => (
                    <TableRow key={s.name} className="border-[#25332B]">
                      <TableCell className="text-sm text-white font-medium">{s.name}</TableCell>
                      <TableCell className="text-sm text-[#768B80]">{s.role}</TableCell>
                      <TableCell className="text-sm text-[#768B80]">{s.email}</TableCell>
                      <TableCell className="text-sm text-[#768B80]">{s.phone}</TableCell>
                      <TableCell>
                        {s.active ? (
                          <Badge className="bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30 text-[10px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#12B877] mr-1" /> Active
                          </Badge>
                        ) : (
                          <Badge className="bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30 text-[10px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#768B80] mr-1" /> Inactive
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="mt-4">
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {Array.from({ length: restaurant.tables }, (_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#1A231E]/50 border border-[#25332B] text-center hover:border-[#12B877]/30 transition-colors cursor-pointer group">
                    <QrCode className="h-6 w-6 mx-auto mb-1 text-[#768B80] group-hover:text-[#12B877]" />
                    <p className="text-xs font-medium text-white">Table {i + 1}</p>
                    <p className="text-[10px] text-[#768B80]">
                      {i < 8 ? '2 seats' : i < 18 ? '4 seats' : '6 seats'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="mt-4">
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B]">
                  <p className="text-xs text-[#768B80] uppercase mb-1">Current Plan</p>
                  <p className="text-lg font-bold text-white">{restaurant.plan}</p>
                  <p className="text-xs text-[#768B80]">NPR 45,000/month</p>
                </div>
                <div className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B]">
                  <p className="text-xs text-[#768B80] uppercase mb-1">Billing Cycle</p>
                  <p className="text-lg font-bold text-white">Monthly</p>
                  <p className="text-xs text-[#768B80]">Next billing: Aug 5, 2024</p>
                </div>
                <div className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B]">
                  <p className="text-xs text-[#768B80] uppercase mb-1">Trial</p>
                  <p className="text-lg font-bold text-white">Expired</p>
                  <p className="text-xs text-[#768B80]">Ended Mar 15, 2024</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-[#25332B] text-[#768B80] text-xs">
                  Override Plan
                </Button>
                <Button variant="outline" size="sm" className="border-[#25332B] text-[#768B80] text-xs">
                  Extend Trial
                </Button>
                <Button variant="outline" size="sm" className="border-[#25332B] text-[#768B80] text-xs">
                  Apply Credit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="mt-4">
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#25332B]">
                    <TableHead className="text-[#768B80] text-xs">Ticket</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Subject</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Priority</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Status</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Created</TableHead>
                    <TableHead className="text-[#768B80] text-xs">Assignee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportTickets.map((t) => (
                    <TableRow key={t.id} className="border-[#25332B]">
                      <TableCell className="text-sm text-white font-medium">{t.id}</TableCell>
                      <TableCell className="text-sm text-[#768B80]">{t.subject}</TableCell>
                      <TableCell>
                        <Badge className={`border text-[10px] ${
                          t.priority === 'High' ? 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30'
                            : t.priority === 'Medium' ? 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30'
                            : 'bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30'
                        }`}>{t.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`border text-[10px] ${
                          t.status === 'Open' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'
                            : t.status === 'Resolved' ? 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30'
                            : 'bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30'
                        }`}>{t.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[#768B80]">{formatDate(t.created)}</TableCell>
                      <TableCell className="text-xs text-[#768B80]">{t.assignee}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {restaurant.documents.map((doc) => (
                  <div key={doc} className="flex items-center gap-3 p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B] hover:border-[#12B877]/30 transition-colors cursor-pointer group">
                    <FileText className="h-8 w-8 text-[#768B80] group-hover:text-[#12B877]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{doc}</p>
                      <p className="text-xs text-[#768B80]">Uploaded Jan 15, 2024</p>
                    </div>
                    <Download className="h-4 w-4 text-[#768B80] group-hover:text-[#12B877]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="mt-4">
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-white">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#25332B]">
                {[
                  { action: 'Plan upgraded from Basic to Pro', by: 'Super Admin', time: '2024-06-15 14:30', type: 'change' },
                  { action: 'Payment of NPR 45,000 received', by: 'System', time: '2024-06-01 09:15', type: 'payment' },
                  { action: 'Restaurant suspended for non-payment', by: 'Finance Admin', time: '2024-05-20 11:00', type: 'alert' },
                  { action: 'Support ticket TKT-002 resolved', by: 'Support Team B', time: '2024-05-18 16:45', type: 'support' },
                  { action: 'Staff member Anita Rai deactivated', by: 'Owner', time: '2024-05-10 10:30', type: 'change' },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                      log.type === 'payment' ? 'bg-[#12B877]' : log.type === 'alert' ? 'bg-[#DB3A3A]' : 'bg-[#3B82F6]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70">{log.action}</p>
                      <p className="text-xs text-[#768B80]">{log.by} · {log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
