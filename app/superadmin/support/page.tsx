'use client';

import { PageHeader } from '@/components/shared/page-header';

import React, { useEffect, useState, useTransition } from 'react';
import {
  Search, Send, ChevronDown, Megaphone, BookOpen, Building2, ShoppingCart, Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatNumber, formatRelativeTime, formatDate } from '@/lib/format';
import { getSupportQuickStats, getRecentNotifications, sendMassCommunication } from '@/lib/actions/admin';
import { ComingSoon } from '@/components/superadmin/coming-soon';
import { toast } from 'sonner';

export default function SupportCenter() {
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [audience, setAudience] = useState('all');
  const [audienceValue, setAudienceValue] = useState('');
  const [channel, setChannel] = useState('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, startSend] = useTransition();

  useEffect(() => {
    getSupportQuickStats().then(setStats);
    getRecentNotifications().then(setNotifications);
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
        toast.success(`Message sent to ${res.data?.restaurantCount || 0} restaurant(s) (${res.data?.recipientCount || 0} recipients)`);
        setSubject('');
        setMessage('');
      }
    });
  };

  const filteredTickets = notifications.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Support Center" description="Manage tickets, knowledge base, and communications">
        <Badge className="border-primary/30 text-primary bg-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          Live
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications by title, message..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No tickets found matching your filters</div>
            ) : (
              filteredTickets.map((n) => (
                <Card key={n.id} className="bg-card border-border shadow-sm hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          n.type === "ALERT" ? "bg-destructive/10" : n.type === "INFO" ? "bg-info/10" : "bg-accent/10"
                        }`}>
                          <Bell className={`h-4 w-4 ${
                            n.type === "ALERT" ? "text-destructive" : n.type === "INFO" ? "text-info" : "text-accent"
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge className="border text-[10px] bg-muted text-muted-foreground border-border">{n.type}</Badge>
                            <span className="text-[10px] text-muted-foreground">{n.restaurant?.name}</span>
                            <span className="text-[10px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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
                      <Bell className="h-4 w-4 text-info" />
                      <span className="text-sm text-foreground">Recent Notifications</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{formatNumber(stats.totalNotifications)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground">Knowledge Base</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <ComingSoon message="Help articles, FAQs, and onboarding guides for restaurant owners and their staff." />
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
    </div>
  );
}
