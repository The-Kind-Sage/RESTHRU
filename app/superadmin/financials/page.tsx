'use client';

import React, { useEffect, useState } from 'react';
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
import { getFinancialData } from '@/lib/actions/admin';

const ArStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    SETTLED: 'bg-primary/10 text-primary border-primary/30',
    PENDING: 'bg-accent/10 text-accent border-accent/30',
  };
  return <Badge className={`border capitalize ${colors[status] || ''}`}>{status.toLowerCase()}</Badge>;
};

export default function AdminFinancials() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getFinancialData().then(setData);
  }, []);

  if (!data) {
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
        <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  const totalBills = data.billsByStatus.reduce((s: number, b: any) => s + b.amount, 0);
  const settledAmount = data.billsByStatus.find((b: any) => b.status === "SETTLED")?.amount || 0;
  const pendingAmount = data.billsByStatus.find((b: any) => b.status === "PENDING")?.amount || 0;

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Across {data.totalOrders} orders</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue by Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {data.revenueByPayment.slice(0, 4).map((r: any) => (
                <div key={r.method} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{r.method}</span>
                  <span className="text-foreground font-medium">{formatCurrency(r.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBills)}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(settledAmount)} settled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">Payment Gateway Costs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.revenueByPayment.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No data available</div>
            ) : (
              <div className="space-y-3">
                {data.revenueByPayment.map((r: any) => {
                  const feeRate = r.method === "CARD" ? 0.025 : r.method === "MOBILE" ? 0.012 : 0;
                  const fee = r.amount * feeRate;
                  return (
                    <div key={r.method} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.method}</p>
                        <p className="text-[11px] text-muted-foreground">{r.count} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{formatCurrency(r.amount)}</p>
                        {feeRate > 0 && (
                          <p className="text-[11px] text-destructive">Fee: {formatCurrency(Math.round(fee))} ({(feeRate * 100).toFixed(1)}%)</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            {data.billsByStatus.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No data available</div>
            ) : (
              <div className="space-y-3">
                {data.billsByStatus.map((b: any) => (
                  <div key={b.status} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2">
                      <ArStatusBadge status={b.status} />
                      <span className="text-xs text-muted-foreground">{b.count} bills</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{formatCurrency(b.amount)}</span>
                  </div>
                ))}
              </div>
            )}
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
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Total Revenue</span>
                <span className="text-sm font-medium text-primary">{formatCurrency(data.totalRevenue)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Gross Billings</span>
                <span className="text-sm font-medium text-foreground">{formatCurrency(totalBills)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Settled</span>
                <span className="text-sm font-medium text-primary">{formatCurrency(settledAmount)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Unsettled</span>
                <span className="text-sm font-medium text-accent">{formatCurrency(pendingAmount)}</span>
              </div>
            </div>
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
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Average Order Value</span>
                <span className="text-sm font-medium text-foreground">{formatCurrency(Math.round(data.avgOrderValue))}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Avg Items Per Order</span>
                <span className="text-sm font-medium text-foreground">{data.avgItemsPerOrder}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Total Order Items</span>
                <span className="text-sm font-medium text-foreground">{data.totalOrderItems.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Total Orders</span>
                <span className="text-sm font-medium text-foreground">{data.totalOrders.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
