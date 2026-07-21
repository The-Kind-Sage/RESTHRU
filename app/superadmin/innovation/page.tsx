'use client';

import { PageHeader } from '@/components/shared/page-header';

import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Lightbulb,
  Layers,
  Building2,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/format';
import { getInnovationData } from '@/lib/actions/admin';

export default function AdminInnovation() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getInnovationData().then(setData);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Innovation Lab" description="Platform-wide insights and category benchmarks">
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
          <FlaskConical className="h-3.5 w-3.5 mr-1" /> Beta
        </Badge>
      </PageHeader>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm font-medium text-foreground">Platform Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No insights available</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {data.insights.map((insight: any, idx: number) => {
                const icons = [Building2, ShoppingCart, TrendingUp, UtensilsCrossed];
                const Icon = icons[idx] ?? Building2;
                return (
                  <Card key={idx} className="bg-card border-border shadow-sm">
                    <CardContent className="py-4 px-4 text-center">
                      <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                      <p className="text-lg font-bold text-foreground">{insight.value}</p>
                      <p className="text-[11px] text-muted-foreground">{insight.title}</p>
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
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Restaurants by Category</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Active restaurants grouped by type</p>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
          ) : data.benchmarks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No restaurants yet</div>
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
    </div>
  );
}
