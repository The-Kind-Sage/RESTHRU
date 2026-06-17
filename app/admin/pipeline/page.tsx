'use client';

import React, { useState } from 'react';
import {
  Phone, Mail, Calendar, Clock, ChevronRight, ChevronLeft,
  ArrowUpRight, Activity, CheckCircle, Timer, UserPlus,
  Building2, MoreHorizontal, Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime, formatPercentage } from '@/lib/format';

interface PipelineCompany {
  id: number;
  name: string;
  city: string;
  owner: string;
  planInterest: string;
  daysInStage: number;
  value: number;
}

interface PipelineStage {
  name: string;
  count: number;
  color: string;
  companies: PipelineCompany[];
}

const pipelineStages: PipelineStage[] = [
  {
    name: 'Lead', count: 5, color: 'hsl(var(--muted-foreground))',
    companies: [
      { id: 1, name: 'Momo House', city: 'Kathmandu', owner: 'Rabi Shrestha', planInterest: 'Basic', daysInStage: 3, value: 15000 },
      { id: 2, name: 'Everest View Cafe', city: 'Pokhara', owner: 'Nima Sherpa', planInterest: 'Pro', daysInStage: 7, value: 45000 },
      { id: 3, name: 'Spice Garden', city: 'Chitwan', owner: 'Gita Adhikari', planInterest: 'Basic', daysInStage: 1, value: 12000 },
      { id: 4, name: 'Kora Bakery', city: 'Lalitpur', owner: 'Tsering Lama', planInterest: 'Free', daysInStage: 5, value: 0 },
      { id: 5, name: 'Boudha Bistro', city: 'Kathmandu', owner: 'Sangay Dolma', planInterest: 'Pro', daysInStage: 2, value: 35000 },
    ],
  },
  {
    name: 'Contacted', count: 12, color: 'hsl(var(--info))',
    companies: [
      { id: 6, name: 'Mandala Kitchen', city: 'Bhaktapur', owner: 'Rajesh Maharjan', planInterest: 'Pro', daysInStage: 4, value: 55000 },
      { id: 7, name: 'Green Bowl', city: 'Pokhara', owner: 'Anupa Rai', planInterest: 'Basic', daysInStage: 6, value: 18000 },
      { id: 8, name: 'Himalayan Java', city: 'Kathmandu', owner: 'Prakash Neupane', planInterest: 'Enterprise', daysInStage: 2, value: 95000 },
      { id: 9, name: 'Patan Square', city: 'Lalitpur', owner: 'Binita Shrestha', planInterest: 'Pro', daysInStage: 8, value: 42000 },
      { id: 10, name: 'Dharma Cafe', city: 'Kathmandu', owner: 'Karma Wangmo', planInterest: 'Basic', daysInStage: 1, value: 14000 },
    ],
  },
  {
    name: 'Demo Scheduled', count: 8, color: 'hsl(var(--accent))',
    companies: [
      { id: 11, name: 'Mountain Delights', city: 'Pokhara', owner: 'Dawa Tamang', planInterest: 'Pro', daysInStage: 2, value: 65000 },
      { id: 12, name: 'Garden Kitchen', city: 'Chitwan', owner: 'Sita Poudel', planInterest: 'Enterprise', daysInStage: 1, value: 110000 },
      { id: 13, name: 'New Road Cafe', city: 'Kathmandu', owner: 'Amit Shah', planInterest: 'Pro', daysInStage: 3, value: 48000 },
      { id: 14, name: 'Basantapur Bites', city: 'Kathmandu', owner: 'Shyam Shrestha', planInterest: 'Basic', daysInStage: 5, value: 22000 },
      { id: 15, name: 'Lakeside Grill', city: 'Pokhara', owner: 'Maya Gurung', planInterest: 'Pro', daysInStage: 1, value: 52000 },
    ],
  },
  {
    name: 'Trial Active', count: 15, color: 'hsl(var(--primary))',
    companies: [
      { id: 16, name: 'Thamel Terrace', city: 'Kathmandu', owner: 'Rajan Karki', planInterest: 'Pro', daysInStage: 12, value: 58000 },
      { id: 17, name: 'Boudha Bowl', city: 'Kathmandu', owner: 'Jigme Bhote', planInterest: 'Enterprise', daysInStage: 8, value: 125000 },
      { id: 18, name: 'Pokhara Patio', city: 'Pokhara', owner: 'Sushila Thapa', planInterest: 'Pro', daysInStage: 15, value: 62000 },
      { id: 19, name: 'Chitwan Diner', city: 'Chitwan', owner: 'Hari Subedi', planInterest: 'Basic', daysInStage: 5, value: 25000 },
      { id: 20, name: 'Durbar Delight', city: 'Lalitpur', owner: 'Puja Shakya', planInterest: 'Pro', daysInStage: 10, value: 47000 },
    ],
  },
  {
    name: 'Negotiation', count: 4, color: 'hsl(var(--destructive))',
    companies: [
      { id: 21, name: 'Langtang Kitchen', city: 'Kathmandu', owner: 'Pasang Sherpa', planInterest: 'Enterprise', daysInStage: 6, value: 150000 },
      { id: 22, name: 'Annapurna Dining', city: 'Pokhara', owner: 'Bimala Rana', planInterest: 'Pro', daysInStage: 4, value: 74000 },
      { id: 23, name: 'Swayambhu Cafe', city: 'Kathmandu', owner: 'Nabin Maharjan', planInterest: 'Enterprise', daysInStage: 8, value: 135000 },
      { id: 24, name: 'Phewa Restaurant', city: 'Pokhara', owner: 'Kiran Thapa', planInterest: 'Pro', daysInStage: 3, value: 68000 },
    ],
  },
  {
    name: 'Closed-Won', count: 28, color: 'hsl(var(--primary))',
    companies: [
      { id: 25, name: 'Sagarmatha Palace', city: 'Pokhara', owner: 'Sonam Sherpa', planInterest: 'Enterprise', daysInStage: 0, value: 220000 },
      { id: 26, name: 'Himalayan Kitchen', city: 'Kathmandu', owner: 'Ramesh Poudel', planInterest: 'Pro', daysInStage: 0, value: 125000 },
      { id: 27, name: 'Thakali House', city: 'Pokhara', owner: 'Bhim Magar', planInterest: 'Enterprise', daysInStage: 0, value: 285000 },
      { id: 28, name: 'Pokhara Grill', city: 'Pokhara', owner: 'Deepak Ale', planInterest: 'Pro', daysInStage: 0, value: 185000 },
      { id: 29, name: 'Chitwan Wildlife Cafe', city: 'Chitwan', owner: 'Govind Thapa', planInterest: 'Pro', daysInStage: 0, value: 165000 },
    ],
  },
  {
    name: 'Closed-Lost', count: 6, color: 'hsl(var(--muted-foreground))',
    companies: [
      { id: 30, name: 'Mountain Cafe', city: 'Kathmandu', owner: 'Ramesh Ghimire', planInterest: 'Basic', daysInStage: 0, value: 0 },
      { id: 31, name: 'Sunrise Diner', city: 'Pokhara', owner: 'Krishna Rai', planInterest: 'Free', daysInStage: 0, value: 0 },
      { id: 32, name: 'River View', city: 'Chitwan', owner: 'Ram Gurung', planInterest: 'Basic', daysInStage: 0, value: 0 },
      { id: 33, name: 'Heritage Inn', city: 'Bhaktapur', owner: 'Suman Suwal', planInterest: 'Pro', daysInStage: 0, value: 0 },
    ],
  },
];

interface Activity {
  id: number;
  type: string;
  company: string;
  action: string;
  user: string;
  time: string;
}

const recentActivities: Activity[] = [
  { id: 1, type: 'demo', company: 'Mountain Delights', action: 'Demo scheduled for Jul 22', user: 'Anita Gurung', time: '12 min ago' },
  { id: 2, type: 'trial', company: 'Thamel Terrace', action: 'Trial converted to Pro', user: 'Rajan Karki', time: '28 min ago' },
  { id: 3, type: 'contact', company: 'Mandala Kitchen', action: 'Follow-up email sent', user: 'Binay Shah', time: '42 min ago' },
  { id: 4, type: 'lead', company: 'Momo House', action: 'Qualified as hot lead', user: 'Anita Gurung', time: '1h ago' },
  { id: 5, type: 'demo', company: 'Garden Kitchen', action: 'Demo completed - interested', user: 'Binay Shah', time: '1h ago' },
  { id: 6, type: 'negotiation', company: 'Langtang Kitchen', action: 'Proposal sent', user: 'Anita Gurung', time: '2h ago' },
  { id: 7, type: 'trial', company: 'Boudha Bowl', action: 'Trial extended 7 days', user: 'Raj Thapa', time: '3h ago' },
  { id: 8, type: 'contact', company: 'Himalayan Java', action: 'Call scheduled', user: 'Binay Shah', time: '4h ago' },
];

interface TrialEntry {
  id: number;
  restaurant: string;
  plan: string;
  daysRemaining: number;
  usage: number;
  status: string;
}

const trialData: TrialEntry[] = [
  { id: 1, restaurant: 'Thamel Terrace', plan: 'Pro Trial', daysRemaining: 3, usage: 72, status: 'At Risk' },
  { id: 2, restaurant: 'Boudha Bowl', plan: 'Enterprise Trial', daysRemaining: 7, usage: 45, status: 'Engaged' },
  { id: 3, restaurant: 'Pokhara Patio', plan: 'Pro Trial', daysRemaining: 0, usage: 88, status: 'Expiring' },
  { id: 4, restaurant: 'Chitwan Diner', plan: 'Basic Trial', daysRemaining: 10, usage: 32, status: 'Engaged' },
  { id: 5, restaurant: 'Durbar Delight', plan: 'Pro Trial', daysRemaining: 5, usage: 61, status: 'Engaged' },
  { id: 6, restaurant: 'Lakeside Grill', plan: 'Pro Trial', daysRemaining: 14, usage: 25, status: 'Onboarded' },
  { id: 7, restaurant: 'Basantapur Bites', plan: 'Basic Trial', daysRemaining: 2, usage: 55, status: 'At Risk' },
];

interface OnboardingEntry {
  id: number;
  restaurant: string;
  menuSetup: boolean;
  staffAdded: boolean;
  qrGenerated: boolean;
  firstOrder: boolean;
  activationStatus: string;
}

const onboardingData: OnboardingEntry[] = [
  { id: 1, restaurant: 'Thamel Terrace', menuSetup: true, staffAdded: true, qrGenerated: true, firstOrder: false, activationStatus: 'In Progress' },
  { id: 2, restaurant: 'Boudha Bowl', menuSetup: true, staffAdded: true, qrGenerated: true, firstOrder: true, activationStatus: 'Activated' },
  { id: 3, restaurant: 'Pokhara Patio', menuSetup: true, staffAdded: false, qrGenerated: false, firstOrder: false, activationStatus: 'Pending' },
  { id: 4, restaurant: 'Chitwan Diner', menuSetup: true, staffAdded: true, qrGenerated: true, firstOrder: true, activationStatus: 'Activated' },
  { id: 5, restaurant: 'Durbar Delight', menuSetup: true, staffAdded: true, qrGenerated: false, firstOrder: false, activationStatus: 'In Progress' },
  { id: 6, restaurant: 'Lakeside Grill', menuSetup: true, staffAdded: true, qrGenerated: true, firstOrder: true, activationStatus: 'Activated' },
  { id: 7, restaurant: 'Basantapur Bites', menuSetup: false, staffAdded: false, qrGenerated: false, firstOrder: false, activationStatus: 'Pending' },
];

const activityIcons: Record<string, React.ElementType> = {
  demo: Calendar,
  trial: CheckCircle,
  contact: Mail,
  lead: UserPlus,
  negotiation: Clock,
};

const stageBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    'At Risk': 'bg-destructive/10 text-destructive border-destructive/30',
    'Engaged': 'bg-info/10 text-info border-info/30',
    'Expiring': 'bg-accent/10 text-accent border-accent/30',
    'Onboarded': 'bg-primary/10 text-primary border-primary/30',
  };
  return colors[status] || 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30';
};

const activationBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    'Activated': 'bg-primary/10 text-primary border-primary/30',
    'In Progress': 'bg-accent/10 text-accent border-accent/30',
    'Pending': 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  };
  return colors[status] || 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30';
};

export default function AdminPipeline() {
  const [scrollPos, setScrollPos] = useState(0);
  const pipelineRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (pipelineRef.current) {
      pipelineRef.current.scrollBy({ left: -400, behavior: 'smooth' });
      setScrollPos(pipelineRef.current.scrollLeft - 400);
    }
  };

  const scrollRight = () => {
    if (pipelineRef.current) {
      pipelineRef.current.scrollBy({ left: 400, behavior: 'smooth' });
      setScrollPos(pipelineRef.current.scrollLeft + 400);
    }
  };

  const totalValue = pipelineStages.reduce((sum, s) => sum + s.companies.reduce((cs, c) => cs + c.value, 0), 0);
  const wonValue = pipelineStages[5].companies.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Track leads, trials, and conversions across the funnel</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mr-3">
            <span>Pipeline Value: <span className="text-foreground font-medium">{formatCurrency(totalValue)}</span></span>
            <span>Closed: <span className="text-primary font-medium">{formatCurrency(wonValue)}</span></span>
          </div>
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#060E0A] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#060E0A] to-transparent z-10 pointer-events-none" />
        {scrollPos > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollRight}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div
          ref={pipelineRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin"
          onScroll={(e) => setScrollPos((e.target as HTMLDivElement).scrollLeft)}
        >
          {pipelineStages.map((stage) => (
            <div key={stage.name} className="flex-shrink-0 w-72">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <CardTitle className="text-sm font-medium text-foreground">{stage.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{stage.count}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
                  {stage.companies.map((company) => (
                    <div
                      key={company.id}
                      className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-white group-hover:text-primary transition-colors">{company.name}</p>
                        {company.value > 0 && (
                          <span className="text-[10px] font-medium text-primary">{formatCurrency(company.value)}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1.5">{company.city} · {company.owner}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-border text-muted-foreground text-[9px] h-5">{company.planInterest}</Badge>
                        {company.daysInStage > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {company.daysInStage}d
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">Recent Activity</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Latest prospect interactions</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivities.map((act) => {
                const ActIcon = activityIcons[act.type] || Activity;
                return (
                  <div key={act.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ActIcon className="h-3.5 w-3.5 text-primary/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/80 font-medium">{act.company}</p>
                      <p className="text-[10px] text-muted-foreground">{act.action} · {act.user}</p>
                      <p className="text-[10px] text-muted-foreground">{act.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-xs text-primary hover:text-foreground">
                View Full Timeline
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm font-medium text-foreground">Trial Management</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Active trials requiring attention</p>
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[120px] bg-muted border-border text-foreground h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all" className="text-foreground text-xs">All Trials</SelectItem>
                  <SelectItem value="at-risk" className="text-foreground text-xs">At Risk</SelectItem>
                  <SelectItem value="expiring" className="text-foreground text-xs">Expiring</SelectItem>
                  <SelectItem value="engaged" className="text-foreground text-xs">Engaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Plan</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Days Left</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-center">Usage</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialData.map((t) => (
                  <TableRow key={t.id} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{t.restaurant}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">{t.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-medium ${t.daysRemaining <= 3 ? 'text-destructive' : t.daysRemaining <= 7 ? 'text-accent' : 'text-foreground/70'}`}>
                        {t.daysRemaining === 0 ? 'Today' : `${t.daysRemaining}d`}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${t.usage >= 70 ? 'bg-primary' : t.usage >= 40 ? 'bg-accent' : 'bg-info'}`}
                            style={{ width: `${t.usage}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-medium ${t.usage >= 70 ? 'text-primary' : t.usage >= 40 ? 'text-accent' : 'text-info'}`}>{t.usage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border text-[10px] ${stageBadgeColor(t.status)}`}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-primary hover:bg-primary/10">Convert</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-accent hover:bg-accent/10">Extend</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground hover:text-foreground">Follow-up</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">Onboarding Checklist</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Track restaurant activation progress</p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[10px]">
            3 / 7 Activated
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-center">Menu Setup</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-center">Staff Added</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-center">QR Generated</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider text-center">First Order</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Activation Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {onboardingData.map((o) => (
                <TableRow key={o.id} className="border-border hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{o.restaurant}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    {o.menuSetup ? (
                      <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {o.staffAdded ? (
                      <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {o.qrGenerated ? (
                      <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {o.firstOrder ? (
                      <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border mx-auto" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border text-[10px] ${activationBadgeColor(o.activationStatus)}`}>{o.activationStatus}</Badge>
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
