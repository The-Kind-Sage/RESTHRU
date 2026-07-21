'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/format';
import { getComplianceData } from '@/lib/actions/admin';
import { ADMIN_TONE_CLASSES } from '@/lib/constants';
import { SectionSkeleton, KpiSkeleton } from '@/components/superadmin/skeletons';
import { PageHeader } from '@/components/shared/page-header';

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Compliant: ADMIN_TONE_CLASSES.positive,
    'Action Required': ADMIN_TONE_CLASSES.warning,
    'Non-Compliant': ADMIN_TONE_CLASSES.negative,
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

const VerifiedBadge = ({ status }: { status: string }) => {
  if (status === 'Yes') return <span className="flex items-center gap-1 text-primary text-xs"><CheckCircle className="h-3 w-3" /> Yes</span>;
  if (status === 'No') return <span className="flex items-center gap-1 text-destructive text-xs"><XCircle className="h-3 w-3" /> No</span>;
  return <span className="flex items-center gap-1 text-accent text-xs"><Clock className="h-3 w-3" /> Pending</span>;
};

export default function AdminCompliance() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getComplianceData().then(setData);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compliance Dashboard"
        description="PAN/VAT and contact-detail compliance across restaurants"
      >
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          Live
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {!data ? (
          <div className="col-span-full"><KpiSkeleton count={3} /></div>
        ) : (
          <>
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="py-6 px-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Restaurants</p>
                <p className="text-2xl font-bold text-foreground mt-1">{formatNumber(data.total)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="py-6 px-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Compliant</p>
                <p className="text-2xl font-bold text-primary mt-1">{formatNumber(data.compliant)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="py-6 px-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Action Required</p>
                <p className="text-2xl font-bold text-accent mt-1">{formatNumber(data.actionRequired)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium text-foreground">PAN / VAT Verification</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!data ? (
            <SectionSkeleton rows={4} />
          ) : data.restaurants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No PAN/VAT data</div>
          ) : (
            <div className="space-y-2">
              {data.restaurants.slice(0, 10).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.city} | GST: {r.gstNumber || "N/A"}</p>
                  </div>
                  <VerifiedBadge status={r.panVatVerified} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
