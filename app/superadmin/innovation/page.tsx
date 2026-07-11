'use client';

import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Lightbulb,
  Zap,
  FileText,
  BarChart3,
  ThumbsUp,
  Building2,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/format';
import { getInnovationData } from '@/lib/actions/admin';

const ImpactBadge = ({ impact }: { impact: string }) => {
  const colors: Record<string, string> = {
    High: 'bg-primary/10 text-primary border-primary/30',
    Medium: 'bg-accent/10 text-accent border-accent/30',
    Low: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30',
  };
  return <Badge className={`border text-[10px] ${colors[impact] || ''}`}>{impact} Impact</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Running: 'bg-primary/10 text-primary border-primary/30',
    Complete: 'bg-info/10 text-info border-info/30',
    Analyzing: 'bg-accent/10 text-accent border-accent/30',
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

const FeatureStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'Under Review': 'bg-accent/10 text-accent border-accent/30',
    Planned: 'bg-info/10 text-info border-info/30',
    'In Development': 'bg-primary/10 text-primary border-primary/30',
    Launched: 'bg-primary/20 text-primary border-[hsl(var(--primary))]/50',
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

export default function AdminInnovation() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getInnovationData().then(setData);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Innovation Lab</h1>
          <p className="text-sm text-muted-foreground mt-1">AI insights, predictive analytics, experiments & roadmap voting</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
          <FlaskConical className="h-3.5 w-3.5 mr-1" /> Beta
        </Badge>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm font-medium text-foreground">AI-Powered Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No insights available</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {data.insights.map((insight: any, idx: number) => {
                const icons = [Building2, ShoppingCart, TrendingUp, UtensilsCrossed];
                const Icon = icons[idx];
                return (
                  <Card key={idx} className="bg-card border-border shadow-sm">
                    <CardContent className="py-4 px-4 text-center">
                      <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                      <p className="text-lg font-bold text-foreground">{insight.value}</p>
                      <p className="text-[11px] text-muted-foreground">{insight.title}</p>
                      <span className={`text-[10px] ${insight.trendUp ? 'text-primary' : 'text-destructive'}`}>{insight.trend}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Predictive Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">Churn risk prediction — restaurants at risk by category</p>
          {!data ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No prediction data available</div>
          ) : (
            <div className="space-y-3">
              {data.benchmarks.map((b: any) => (
                <div key={b.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-sm text-foreground">{b.type}</span>
                  <Badge className="border text-[10px] bg-muted text-muted-foreground border-border">
                    {formatNumber(b.count)} restaurants
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Benchmark Reports</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Restaurant Category</label>
              <Select>
                <SelectTrigger className="w-[160px] bg-muted border-border text-foreground h-9 text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="casual" className="text-foreground">Casual Dining</SelectItem>
                  <SelectItem value="fine" className="text-foreground">Fine Dining</SelectItem>
                  <SelectItem value="quick" className="text-foreground">Quick Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">City</label>
              <Select>
                <SelectTrigger className="w-[150px] bg-muted border-border text-foreground h-9 text-sm">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="kathmandu" className="text-foreground">Kathmandu</SelectItem>
                  <SelectItem value="pokhara" className="text-foreground">Pokhara</SelectItem>
                  <SelectItem value="chitwan" className="text-foreground">Chitwan</SelectItem>
                  <SelectItem value="all" className="text-foreground">All Cities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Metric</label>
              <Select>
                <SelectTrigger className="w-[160px] bg-muted border-border text-foreground h-9 text-sm">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="revenue" className="text-foreground">Revenue</SelectItem>
                  <SelectItem value="orders" className="text-foreground">Orders</SelectItem>
                  <SelectItem value="satisfaction" className="text-foreground">Satisfaction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white h-9">
              <FileText className="h-4 w-4 mr-1.5" /> Generate PDF
            </Button>
          </div>
          {data && data.benchmarks.length > 0 && (
            <div className="mt-4 space-y-2">
              {data.benchmarks.map((b: any) => (
                <div key={b.type} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border text-xs">
                  <span className="text-foreground">{b.type}</span>
                  <span className="text-muted-foreground">{formatNumber(b.count)} restaurants</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Experiment Tracking</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">No experiments</div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm font-medium text-foreground">Roadmap Voting</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">No feature requests</div>
        </CardContent>
      </Card>
    </div>
  );
}
