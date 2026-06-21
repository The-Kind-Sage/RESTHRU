'use client';

import React, { useState } from 'react';
import {
  Search, Send, ChevronDown, Megaphone, BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

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

export default function SupportCenter() {
  const [search, setSearch] = useState('');

  const filteredTickets: Ticket[] = [];

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
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
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
            <CardContent>
              <div className="text-center py-8 text-muted-foreground text-sm">No stats available</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-foreground">Knowledge Base</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground text-sm">No articles available</div>
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
