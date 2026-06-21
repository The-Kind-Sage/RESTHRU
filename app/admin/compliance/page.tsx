'use client';

import React from 'react';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Compliant: 'bg-primary/10 text-primary border-primary/30',
    'Action Required': 'bg-accent/10 text-accent border-accent/30',
    'Non-Compliant': 'bg-destructive/10 text-destructive border-destructive/30',
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

const VerifiedBadge = ({ status }: { status: string }) => {
  if (status === 'Yes') return <span className="flex items-center gap-1 text-primary text-xs"><CheckCircle className="h-3 w-3" /> Yes</span>;
  if (status === 'No') return <span className="flex items-center gap-1 text-destructive text-xs"><XCircle className="h-3 w-3" /> No</span>;
  return <span className="flex items-center gap-1 text-accent text-xs"><Clock className="h-3 w-3" /> Pending</span>;
};

export default function AdminCompliance() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Compliance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">IRD compliance, document vault, fraud detection & data export</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          Auto-Sync Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm col-span-full">
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No compliance data available</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">PAN / VAT Verification</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">No PAN/VAT data</div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Document Vault</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">No documents</div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm font-medium text-foreground">Fraud Detection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">No fraud data</div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">Data Export Requests</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">No export requests</div>
        </CardContent>
      </Card>
    </div>
  );
}
