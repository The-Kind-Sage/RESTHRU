'use client';

import React from 'react';
import {
  FlaskConical,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Eye,
  ThumbsUp,
  MessageCircle,
  Zap,
  Target,
  MapPin,
  Utensils,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { formatDate, formatNumber } from '@/lib/format';

const insights = [
  {
    icon: TrendingUp,
    headline: 'Pokhara restaurants growing 30% faster than Kathmandu',
    description: 'Restaurants in Pokhara show 30% higher month-over-month order growth compared to Kathmandu venues.',
    impact: 'High',
  },
  {
    icon: Target,
    headline: 'Pro plan adopters of inventory have 40% lower churn',
    description: 'Restaurants on the Pro plan who actively use the inventory module retain at significantly higher rates.',
    impact: 'High',
  },
  {
    icon: TrendingUp,
    headline: 'Weekend lunch orders up 25% in tourist cities',
    description: 'Pokhara, Chitwan, and Dhulikhel show a 25% surge in weekend lunch orders during peak tourist season.',
    impact: 'Medium',
  },
  {
    icon: BarChart3,
    headline: 'Quick-service restaurants adopting digital menus 3x faster',
    description: 'QSR category shows triple the adoption rate of digital menus vs fine dining establishments.',
    impact: 'Medium',
  },
  {
    icon: Target,
    headline: 'Evening delivery orders peak at 7:15 PM across all cities',
    description: 'Data shows a consistent peak window between 7-8 PM for delivery orders platform-wide.',
    impact: 'Low',
  },
];

const churnPredictionData = [
  { month: 'Jan', low: 120, medium: 45, high: 18 },
  { month: 'Feb', low: 115, medium: 48, high: 20 },
  { month: 'Mar', low: 108, medium: 42, high: 16 },
  { month: 'Apr', low: 95, medium: 38, high: 14 },
  { month: 'May', low: 88, medium: 35, high: 12 },
  { month: 'Jun', low: 82, medium: 32, high: 10 },
  { month: 'Jul', low: 75, medium: 28, high: 8 },
];

const experiments = [
  { name: 'Dynamic Pricing Engine', variants: 'Control vs Algorithm A vs Algorithm B', startDate: '2026-05-01', sampleSize: 120, result: '+18% revenue', status: 'Complete' },
  { name: 'AI Upsell Suggestions', variants: 'Control vs AI Model v2', startDate: '2026-06-01', sampleSize: 85, result: '+12% avg order value', status: 'Analyzing' },
  { name: 'Smart Waitlist', variants: 'Legacy vs Real-time Queue', startDate: '2026-06-10', sampleSize: 45, result: 'Pending', status: 'Running' },
  { name: 'Personalized Push', variants: 'Batch vs Event-triggered', startDate: '2026-06-15', sampleSize: 60, result: 'Pending', status: 'Running' },
  { name: 'Menu A/B Testing', variants: 'Image-first vs Text-first', startDate: '2026-04-15', sampleSize: 200, result: '+8% conversion', status: 'Complete' },
];

const featureRequests = [
  { feature: 'Multi-location management for chains', votes: 47, status: 'In Development', response: 'Scheduled for Q3 release' },
  { feature: 'WhatsApp ordering integration', votes: 38, status: 'Planned', response: 'Under technical evaluation' },
  { feature: 'Advanced inventory forecasting with AI', votes: 31, status: 'Under Review', response: 'Gathering requirements' },
  { feature: 'Bulk menu import from Excel/CSV', votes: 26, status: 'Planned', response: 'Design phase complete' },
  { feature: 'Real-time order tracking for customers', votes: 22, status: 'Launched', response: 'Released in v2.4.0' },
  { feature: 'Loyalty programme builder', votes: 19, status: 'Under Review', response: 'Assessing feasibility' },
];

const ImpactBadge = ({ impact }: { impact: string }) => {
  const colors: Record<string, string> = {
    High: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    Medium: 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
    Low: 'bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30',
  };
  return <Badge className={`border text-[10px] ${colors[impact] || ''}`}>{impact} Impact</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Running: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    Complete: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30',
    Analyzing: 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

const FeatureStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'Under Review': 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
    Planned: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30',
    'In Development': 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    Launched: 'bg-[#12B877]/20 text-[#12B877] border-[#12B877]/50',
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

export default function AdminInnovation() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Innovation Lab</h1>
          <p className="text-sm text-[#768B80] mt-1">AI insights, predictive analytics, experiments & roadmap voting</p>
        </div>
        <Badge variant="outline" className="border-[#12B877]/30 text-[#12B877] bg-[#12B877]/5">
          <FlaskConical className="h-3.5 w-3.5 mr-1" /> Beta
        </Badge>
      </div>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#F4B740]" />
            <CardTitle className="text-sm font-medium text-white">AI-Powered Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <div key={i} className="flex gap-3 p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B] hover:border-[#12B877]/30 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-[#12B877]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4.5 w-4.5 text-[#12B877]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-white">{insight.headline}</h3>
                      <ImpactBadge impact={insight.impact} />
                    </div>
                    <p className="text-xs text-[#768B80] mt-1">{insight.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">Predictive Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#768B80] mb-4">Churn risk prediction — restaurants at risk by category</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={churnPredictionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#25332B" />
              <XAxis dataKey="month" stroke="#768B80" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#768B80" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0D1711', border: '1px solid #25332B', borderRadius: '8px' }}
                labelStyle={{ color: '#EDEDED' }}
              />
              <Line type="monotone" dataKey="low" stroke="#12B877" strokeWidth={2} name="Low Risk" />
              <Line type="monotone" dataKey="medium" stroke="#F4B740" strokeWidth={2} name="Medium Risk" />
              <Line type="monotone" dataKey="high" stroke="#DB3A3A" strokeWidth={2} name="High Risk" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#12B877]" />
              <span className="text-[10px] text-[#768B80]">Low Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#F4B740]" />
              <span className="text-[10px] text-[#768B80]">Medium Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#DB3A3A]" />
              <span className="text-[10px] text-[#768B80]">High Risk</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">Benchmark Reports</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#768B80] uppercase tracking-wider font-medium">Restaurant Category</label>
              <Select>
                <SelectTrigger className="w-[160px] bg-[#1A231E] border-[#25332B] text-white h-9 text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1711] border-[#25332B]">
                  <SelectItem value="casual" className="text-white">Casual Dining</SelectItem>
                  <SelectItem value="fine" className="text-white">Fine Dining</SelectItem>
                  <SelectItem value="quick" className="text-white">Quick Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#768B80] uppercase tracking-wider font-medium">City</label>
              <Select>
                <SelectTrigger className="w-[150px] bg-[#1A231E] border-[#25332B] text-white h-9 text-sm">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1711] border-[#25332B]">
                  <SelectItem value="kathmandu" className="text-white">Kathmandu</SelectItem>
                  <SelectItem value="pokhara" className="text-white">Pokhara</SelectItem>
                  <SelectItem value="chitwan" className="text-white">Chitwan</SelectItem>
                  <SelectItem value="all" className="text-white">All Cities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#768B80] uppercase tracking-wider font-medium">Metric</label>
              <Select>
                <SelectTrigger className="w-[160px] bg-[#1A231E] border-[#25332B] text-white h-9 text-sm">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1711] border-[#25332B]">
                  <SelectItem value="revenue" className="text-white">Revenue</SelectItem>
                  <SelectItem value="orders" className="text-white">Orders</SelectItem>
                  <SelectItem value="satisfaction" className="text-white">Satisfaction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-[#12B877] hover:bg-[#0E945E] text-white h-9">
              <FileText className="h-4 w-4 mr-1.5" /> Generate PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#0D1711] border border-[#25332B] shadow-admin-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#12B877]/10 flex items-center justify-center">
              <Utensils className="h-4 w-4 text-[#12B877]" />
            </div>
            <h3 className="text-sm font-medium text-white">Rising Cuisines</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Newari</span>
              <span className="text-xs text-[#12B877]">+42%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Korean</span>
              <span className="text-xs text-[#12B877]">+38%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Japanese</span>
              <span className="text-xs text-[#12B877]">+27%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Fusion</span>
              <span className="text-xs text-[#12B877]">+21%</span>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[#0D1711] border border-[#25332B] shadow-admin-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#DB3A3A]/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-[#DB3A3A]" />
            </div>
            <h3 className="text-sm font-medium text-white">Declining Payments</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Cash on Delivery</span>
              <span className="text-xs text-[#DB3A3A]">-18%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Bank Transfer</span>
              <span className="text-xs text-[#DB3A3A]">-12%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Visa/Mastercard</span>
              <span className="text-xs text-[#F4B740]">-5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Mobile Banking</span>
              <span className="text-xs text-[#12B877]">+15%</span>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[#0D1711] border border-[#25332B] shadow-admin-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-[#3B82F6]" />
            </div>
            <h3 className="text-sm font-medium text-white">Demand Shifts</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Pokhara lakeside</span>
              <span className="text-xs text-[#12B877]">+35%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Chitwan safari</span>
              <span className="text-xs text-[#12B877]">+28%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Kathmandu valley</span>
              <span className="text-xs text-[#F4B740]">+8%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#768B80]">Dhulikhel hills</span>
              <span className="text-xs text-[#12B877]">+22%</span>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">Experiment Tracking</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Experiment</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Variants</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Start Date</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Sample Size</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Result</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((row) => (
                <TableRow key={row.name} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell><span className="text-sm font-medium text-white">{row.name}</span></TableCell>
                  <TableCell><span className="text-xs text-[#768B80]">{row.variants}</span></TableCell>
                  <TableCell><span className="text-xs text-[#768B80]">{formatDate(new Date(row.startDate))}</span></TableCell>
                  <TableCell className="text-right text-white/70 text-sm">{formatNumber(row.sampleSize)}</TableCell>
                  <TableCell><span className="text-xs text-white/70">{row.result}</span></TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-[#F4B740]" />
            <CardTitle className="text-sm font-medium text-white">Roadmap Voting</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Feature Request</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Votes</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Admin Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureRequests.map((row) => (
                <TableRow key={row.feature} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{row.feature}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-bold text-[#F4B740]">{formatNumber(row.votes)}</span>
                  </TableCell>
                  <TableCell><FeatureStatusBadge status={row.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 text-[#768B80]" />
                      <span className="text-xs text-[#768B80]">{row.response}</span>
                    </div>
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
