'use client';

import { PageHeader } from '@/components/shared/page-header';

import React, { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Send, Megaphone, Building2, ShoppingCart, Users, MessageSquare,
  LifeBuoy, Image as ImageIcon, CheckCircle2, Clock, AlertCircle, Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatNumber, formatRelativeTime } from '@/lib/format';
import { getSupportQuickStats, getSentAnnouncements, sendMassCommunication } from '@/lib/actions/admin';
import { getSupportTickets, updateTicketStatus } from '@/lib/actions/support';
import { getCurrentUser } from '@/lib/actions/auth';
import { TicketChat } from '@/components/shared/ticket-chat';
import { toast } from 'sonner';

type Announcement = {
  subject: string;
  message: string;
  sentAt: string | Date;
  recipientCount: number;
  restaurantCount: number;
};

export default function SupportCenter() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'notifications' ? 'notifications' : 'support';
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [audience, setAudience] = useState('all');
  const [audienceValue, setAudienceValue] = useState('');
  const [channel, setChannel] = useState('inapp');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, startSend] = useTransition();

  useEffect(() => {
    getSupportQuickStats().then(setStats);
    getSentAnnouncements().then(setAnnouncements);
  }, []);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    startSend(async () => {
      const res = await sendMassCommunication({
        audience: audience as 'all' | 'plan' | 'city',
        audienceValue: audienceValue || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Sent to ${res.data?.restaurantCount || 0} restaurant(s) — ${res.data?.recipientCount || 0} recipient(s)`);
        setSubject('');
        setMessage('');
        // Refresh the broadcast history so the one we just sent shows up.
        getSentAnnouncements().then(setAnnouncements);
      }
    });
  };

  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketTab, setActiveTicketTab] = useState(defaultTab);
  const [notifSearch, setNotifSearch] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    getSupportTickets().then((res) => {
      if (res.data) setTickets(res.data);
    });
    getCurrentUser().then((user) => {
      if (user) setAdminUser(user);
    });
  }, []);

  const filtered = announcements.filter((a) =>
    !search ||
    a.subject.toLowerCase().includes(search.toLowerCase()) ||
    a.message.toLowerCase().includes(search.toLowerCase())
  );

  const openTickets = tickets.filter((t) => t.status === 'OPEN');
  const resolvedTickets = tickets.filter((t) => t.status !== 'OPEN');

  const handleResolve = async (ticketId: string) => {
    const res = await updateTicketStatus(ticketId, 'RESOLVED');
    if (res.success) {
      toast.success('Ticket marked as resolved');
      const r = await getSupportTickets();
      if (r.data) setTickets(r.data);
    } else {
      toast.error(res.error);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case 'IN_PROGRESS': return <Clock className="h-3 w-3 text-blue-500" />;
      case 'RESOLVED': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      default: return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Support Center" description="Manage support tickets and broadcast announcements">
        <Badge className="border-primary/30 text-primary bg-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          Live
        </Badge>
      </PageHeader>

      <Tabs value={activeTicketTab} onValueChange={setActiveTicketTab}>
        <TabsList>
          <TabsTrigger value="support" className="gap-2">
            <LifeBuoy className="h-4 w-4" /> Support Tickets
            {openTickets.length > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">{openTickets.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" /> Notifications
            {tickets.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">{tickets.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-2">
            <Megaphone className="h-4 w-4" /> Broadcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support" className="space-y-6 mt-6">
          {selectedTicketId && adminUser ? (
            <div className="border rounded-lg overflow-hidden bg-card" style={{ height: '600px' }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <p className="text-sm font-medium">
                  {tickets.find(t => t.id === selectedTicketId)?.subject || 'Ticket'}
                </p>
                <div className="flex items-center gap-2">
                  {tickets.find(t => t.id === selectedTicketId)?.status === 'OPEN' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
                      await handleResolve(selectedTicketId);
                      setSelectedTicketId(null);
                    }}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Resolved
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedTicketId(null)}>
                    Back to tickets
                  </Button>
                </div>
              </div>
              <TicketChat
                ticketId={selectedTicketId}
                currentUserId={adminUser.id}
                currentRole="SUPERADMIN"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3 space-y-6">
                {tickets.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                      No support tickets yet. They will appear here when restaurant owners send messages.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className="w-full text-left"
                      >
                        <Card className="bg-card border-border shadow-sm hover:border-primary/40 transition-colors cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <MessageSquare className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                                  <Badge className={`text-[10px] ${
                                    ticket.status === 'OPEN' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                                    'bg-green-500/10 text-green-600 border-green-200'
                                  }`}>
                                    {statusIcon(ticket.status)}
                                    <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {ticket.restaurant?.name} &middot; {ticket.user?.firstName} {ticket.user?.lastName} &middot; {formatRelativeTime(ticket.createdAt)}
                                </p>
                                <p className="text-sm mt-2 text-foreground/80 line-clamp-2">{ticket.message}</p>
                                {ticket.imageUrl && (
                                  <a href={ticket.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                    <ImageIcon className="h-3 w-3" /> View Attachment
                                  </a>
                                )}
                                {ticket._count?.replies > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1.5">
                                    {ticket._count.replies} reply{ticket._count.replies > 1 ? 'ies' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-foreground">Ticket Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm text-foreground">Open</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{tickets.filter(t => t.status === 'OPEN').length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-foreground">Resolved</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{tickets.filter(t => t.status === 'RESOLVED').length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">Total</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{tickets.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={notifSearch}
              onChange={(e) => setNotifSearch(e.target.value)}
              className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
            />
          </div>

          {tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No notifications yet.
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {tickets
                  .filter((t) =>
                    !notifSearch ||
                    t.subject?.toLowerCase().includes(notifSearch.toLowerCase()) ||
                    t.message?.toLowerCase().includes(notifSearch.toLowerCase()) ||
                    t.restaurant?.name?.toLowerCase().includes(notifSearch.toLowerCase())
                  )
                  .map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => { setSelectedTicketId(ticket.id); setActiveTicketTab('support'); }}
                      className="w-full text-left"
                    >
                      <Card className="bg-card border-border shadow-sm hover:border-primary/40 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                                <Badge className={`text-[10px] ${
                                  ticket.status === 'OPEN' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                                  ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                                  'bg-green-500/10 text-green-600 border-green-200'
                                }`}>
                                  {statusIcon(ticket.status)}
                                  <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {ticket.restaurant?.name} &middot; {ticket.user?.firstName} {ticket.user?.lastName} &middot; {formatRelativeTime(ticket.createdAt)}
                              </p>
                              <p className="text-sm mt-2 text-foreground/80 line-clamp-2">{ticket.message}</p>
                              {ticket.imageUrl && (
                                <a href={ticket.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                  <ImageIcon className="h-3 w-3" /> View Attachment
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search broadcasts by subject or message..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">Sent Announcements</CardTitle>
                  <Megaphone className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filtered.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        {announcements.length === 0
                          ? 'No announcements sent yet. Use Mass Communication to broadcast to your restaurants.'
                          : 'No broadcasts match your search.'}
                      </div>
                    ) : (
                      filtered.map((a, i) => (
                        <div
                          key={`${a.subject}-${i}`}
                          className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Megaphone className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{a.subject}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge className="border text-[10px] bg-muted text-muted-foreground border-border">
                                  <Building2 className="h-3 w-3 mr-1" />{formatNumber(a.restaurantCount)} restaurant{a.restaurantCount === 1 ? '' : 's'}
                                </Badge>
                                <Badge className="border text-[10px] bg-muted text-muted-foreground border-border">
                                  <Users className="h-3 w-3 mr-1" />{formatNumber(a.recipientCount)} recipient{a.recipientCount === 1 ? '' : 's'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(a.sentAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-foreground">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  {!stats ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No stats available</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">Total Restaurants</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{formatNumber(stats.totalRestaurants)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">Active</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{formatNumber(stats.activeRestaurants)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-accent" />
                          <span className="text-sm text-foreground">Total Orders</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{formatNumber(stats.totalOrders)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-accent" />
                          <span className="text-sm text-foreground">This Month</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{formatNumber(stats.monthlyOrders)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-info" />
                          <span className="text-sm text-foreground">Broadcasts Sent</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{formatNumber(announcements.length)}</span>
                      </div>
                    </div>
                  )}
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
                    <Select value={audience} onValueChange={(v) => { setAudience(v); setAudienceValue(''); }}>
                      <SelectTrigger className="w-full bg-muted border-border text-foreground h-9 text-sm">
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="all" className="text-foreground">All Restaurants</SelectItem>
                        <SelectItem value="plan" className="text-foreground">By Plan</SelectItem>
                        <SelectItem value="city" className="text-foreground">By City</SelectItem>
                      </SelectContent>
                    </Select>
                    {audience !== 'all' && (
                      <Input
                        value={audienceValue}
                        onChange={(e) => setAudienceValue(e.target.value)}
                        placeholder={audience === 'plan' ? 'e.g. Pro, Basic...' : 'e.g. Kathmandu...'}
                        className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Channel</label>
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger className="w-full bg-muted border-border text-foreground h-9 text-sm">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="inapp" className="text-foreground">In-app</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Delivered as an in-app notification to every user of the targeted restaurants.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Subject</label>
                    <Input
                      placeholder="Message subject..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Message</label>
                    <textarea
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
                    />
                  </div>
                  <Button className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] text-white text-sm h-9" disabled={sending} onClick={handleSend}>
                    <Send className="h-4 w-4 mr-1.5" /> {sending ? 'Sending…' : 'Send Message'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
