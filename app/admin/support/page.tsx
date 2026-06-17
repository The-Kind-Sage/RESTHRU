'use client';

import React, { useState } from 'react';
import {
  Search, Filter, Clock, AlertTriangle, CheckCircle, ChevronDown,
  Eye, MessageSquare, Send, BookOpen, Building2, Users, Globe,
  Megaphone, Mail, Smartphone, Bell, Zap, ArrowUpRight, ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime, formatPercentage } from '@/lib/format';

interface Ticket {
  id: string;
  subject: string;
  restaurant: string;
  plan: string;
  priority: string;
  status: string;
  created: string;
  assignee: string;
  healthScore: number;
  pastTickets: number;
}

const tickets: Ticket[] = [
  { id: '#T-1024', subject: 'POS sync failure during peak hours', restaurant: 'Himalayan Kitchen', plan: 'Pro', priority: 'Critical', status: 'Open', created: '2026-06-17T09:30:00', assignee: 'Unassigned', healthScore: 92, pastTickets: 3 },
  { id: '#T-1023', subject: 'Menu not displaying on mobile app', restaurant: 'Thakali House', plan: 'Enterprise', priority: 'High', status: 'In Progress', created: '2026-06-17T08:15:00', assignee: 'Rajesh', healthScore: 96, pastTickets: 1 },
  { id: '#T-1022', subject: 'Payment gateway timeout error', restaurant: 'Pokhara Grill', plan: 'Pro', priority: 'High', status: 'Open', created: '2026-06-17T07:45:00', assignee: 'Unassigned', healthScore: 88, pastTickets: 5 },
  { id: '#T-1021', subject: 'Staff login issue after password reset', restaurant: 'Newari Delights', plan: 'Basic', priority: 'Medium', status: 'In Progress', created: '2026-06-16T18:20:00', assignee: 'Anita', healthScore: 78, pastTickets: 2 },
  { id: '#T-1020', subject: 'Bulk menu import CSV format error', restaurant: 'Langtang Lodge', plan: 'Enterprise', priority: 'Low', status: 'Resolved', created: '2026-06-16T14:00:00', assignee: 'Rajesh', healthScore: 98, pastTickets: 0 },
  { id: '#T-1019', subject: 'Invoice generation shows wrong tax', restaurant: 'Chitwan Wildlife Cafe', plan: 'Pro', priority: 'Medium', status: 'Open', created: '2026-06-16T11:30:00', assignee: 'Unassigned', healthScore: 85, pastTickets: 4 },
  { id: '#T-1018', subject: 'Table layout editor not saving', restaurant: 'Dhulikhel Traditional', plan: 'Pro', priority: 'High', status: 'In Progress', created: '2026-06-16T10:00:00', assignee: 'Anita', healthScore: 72, pastTickets: 7 },
  { id: '#T-1017', subject: 'App crash on order confirmation', restaurant: 'Kathmandu Cafe', plan: 'Free', priority: 'Critical', status: 'Open', created: '2026-06-16T09:15:00', assignee: 'Unassigned', healthScore: 55, pastTickets: 12 },
  { id: '#T-1016', subject: 'Multi-language menu setup help', restaurant: 'Ilam Coffee & Kitchen', plan: 'Basic', priority: 'Low', status: 'Resolved', created: '2026-06-15T16:45:00', assignee: 'Suman', healthScore: 45, pastTickets: 1 },
  { id: '#T-1015', subject: 'Report export missing date filter', restaurant: 'Nuwakot Dining', plan: 'Basic', priority: 'Medium', status: 'Resolved', created: '2026-06-15T13:20:00', assignee: 'Suman', healthScore: 18, pastTickets: 9 },
];

const quickFilters = ['All', 'Open', 'In Progress', 'Resolved', 'Critical'];

const priorityColors: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border-destructive/30',
  High: 'bg-accent/10 text-accent border-accent/30',
  Medium: 'bg-info/10 text-info border-info/30',
  Low: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
};

const statusColors: Record<string, string> = {
  Open: 'bg-destructive/10 text-destructive border-destructive/30',
  'In Progress': 'bg-accent/10 text-accent border-accent/30',
  Resolved: 'bg-primary/10 text-primary border-primary/30',
};

const planColors: Record<string, string> = {
  Enterprise: 'bg-accent/10 text-accent border-accent/30',
  Pro: 'bg-primary/10 text-primary border-primary/30',
  Basic: 'bg-info/10 text-info border-info/30',
  Free: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
};

const articleData = [
  { title: 'Getting Started with POS Setup', category: 'Setup', views: 1240, updated: '2026-06-10', lang: 'English' },
  { title: 'पीओएस सेटअप सुरु गर्दै', category: 'Setup', views: 680, updated: '2026-06-10', lang: 'Nepali' },
  { title: 'Managing Menu & Inventory', category: 'Operations', views: 890, updated: '2026-06-08', lang: 'English' },
  { title: 'मेनु र स्टक व्यवस्थापन', category: 'Operations', views: 420, updated: '2026-06-08', lang: 'Nepali' },
  { title: 'Payment Gateway Configuration', category: 'Payments', views: 1560, updated: '2026-06-05', lang: 'English' },
  { title: 'भुक्तानी गेटवे कन्फिगरेसन', category: 'Payments', views: 310, updated: '2026-06-05', lang: 'Nepali' },
];

const assignees = ['Unassigned', 'Rajesh', 'Anita', 'Suman', 'Prakash'];

export default function SupportCenter() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [ticketAssignees, setTicketAssignees] = useState<Record<string, string>>({});

  const filteredTickets = tickets.filter((t) => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.restaurant.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'All' || t.status === activeTab || t.priority === activeTab;
    return matchSearch && matchTab;
  });

  const setAssignee = (ticketId: string, assignee: string) => {
    setTicketAssignees((prev) => ({ ...prev, [ticketId]: assignee }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Support Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tickets, knowledge base, and communications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-primary/30 text-primary bg-primary/5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
            4 online
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets by ID, subject, restaurant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickFilters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveTab(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === f
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const currentAssignee = ticketAssignees[ticket.id] || ticket.assignee;
              return (
                <Card key={ticket.id} className="bg-card border-border shadow-sm hover:border-primary/30 transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-mono text-muted-foreground">{ticket.id}</span>
                          <Badge className={`border text-[10px] ${priorityColors[ticket.priority]}`}>{ticket.priority}</Badge>
                          <Badge className={`border text-[10px] ${statusColors[ticket.status]}`}>{ticket.status}</Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatRelativeTime(ticket.created)}</span>
                        </div>
                        <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {ticket.subject}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{ticket.restaurant}</span>
                          </div>
                          <Badge className={`border text-[9px] ${planColors[ticket.plan]}`}>{ticket.plan}</Badge>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">Health:</span>
                            <span className={`text-[10px] font-medium ${
                              ticket.healthScore >= 80 ? 'text-primary' : ticket.healthScore >= 50 ? 'text-accent' : 'text-destructive'
                            }`}>{ticket.healthScore}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{ticket.pastTickets} past tickets</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Select value={currentAssignee} onValueChange={(v) => setAssignee(ticket.id, v)}>
                          <SelectTrigger className="w-[120px] h-8 bg-muted border-border text-foreground text-xs">
                            <SelectValue placeholder="Assignee" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {assignees.map((a) => (
                              <SelectItem key={a} value={a} className="text-foreground text-xs">{a}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredTickets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No tickets found matching your filters</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Open</p>
                    <p className="text-lg font-bold text-foreground">12</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Critical</p>
                    <p className="text-lg font-bold text-foreground">3</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                    <p className="text-lg font-bold text-foreground">4.2h</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SLA Compliance</p>
                    <p className="text-lg font-bold text-foreground">94%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground">Knowledge Base</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-2">
              {articleData.map((article, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border hover:border-[hsl(var(--primary))]/20 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-accent">{article.lang === 'Nepali' ? 'नेपाली' : 'EN'}</span>
                    <Badge className="border text-[9px] bg-card text-muted-foreground border-border">{article.category}</Badge>
                  </div>
                  <p className="text-xs text-foreground font-medium truncate">{article.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{formatNumber(article.views)} views</span>
                    <span className="text-[10px] text-muted-foreground">Updated {formatRelativeTime(article.updated)}</span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs text-primary hover:text-foreground mt-1">
                <ExternalLink className="h-3 w-3 mr-1" /> View Full KB
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground">Mass Communication</CardTitle>
              <Megaphone className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Audience</label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full bg-muted border-border text-foreground h-9 text-sm">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all" className="text-foreground">All Restaurants</SelectItem>
                    <SelectItem value="plan" className="text-foreground">By Plan</SelectItem>
                    <SelectItem value="city" className="text-foreground">By City</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Channel</label>
                <Select defaultValue="email">
                  <SelectTrigger className="w-full bg-muted border-border text-foreground h-9 text-sm">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="email" className="text-foreground">Email</SelectItem>
                    <SelectItem value="sms" className="text-foreground">SMS</SelectItem>
                    <SelectItem value="inapp" className="text-foreground">In-app</SelectItem>
                    <SelectItem value="push" className="text-foreground">Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Subject</label>
                <Input
                  placeholder="Message subject..."
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Message</label>
                <textarea
                  placeholder="Type your message..."
                  rows={4}
                  className="w-full rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
                />
              </div>
              <Button className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] text-white text-sm h-9">
                <Send className="h-4 w-4 mr-1.5" /> Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
