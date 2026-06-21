'use client';

import React from 'react';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  BarChart3,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

const ArStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Current: 'bg-primary/10 text-primary border-primary/30',
    Overdue: 'bg-accent/10 text-accent border-accent/30',
    Critical: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  return <Badge className={`border ${colors[status] || ''}`}>{status}</Badge>;
};

export default function AdminFinancials() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Financial Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Revenue, payment gateways, AR aging & unit economics</p>
        </div>
        <Button variant="outline" size="sm" className="border-border text-primary hover:bg-primary/10">
          <Wallet className="h-4 w-4 mr-1.5" /> Download Report
        </Button>
      </div>

      <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>

      <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">Payment Gateway Costs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-medium text-foreground">AR Aging</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">P&L Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">Unit Economics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
