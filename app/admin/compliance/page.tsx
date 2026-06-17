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
  Eye,
  FileSignature,
  ScrollText,
  Shield,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, formatPercentage, formatRelativeTime } from '@/lib/format';

const kpiCards = [
  { title: 'Valid PAN', value: '510', subtitle: 'out of 547 restaurants', percentage: 93, color: '#12B877' },
  { title: 'VAT Registered', value: '423', subtitle: 'out of 547 restaurants', percentage: 77, color: '#3B82F6' },
  { title: 'Tax Filings Current', value: '89%', subtitle: 'Last quarter compliance', percentage: 89, color: '#F4B740' },
];

const panVatData = [
  { restaurant: 'Himalayan Kitchen', pan: 'PAN-123456', verified: 'Yes', vat: 'VAT-789012', vatVerified: 'Yes', status: 'Compliant' },
  { restaurant: 'Thakali House', pan: 'PAN-234567', verified: 'Yes', vat: 'VAT-890123', vatVerified: 'Yes', status: 'Compliant' },
  { restaurant: 'Pokhara Grill', pan: 'PAN-345678', verified: 'Pending', vat: 'VAT-901234', vatVerified: 'No', status: 'Action Required' },
  { restaurant: 'Newari Delights', pan: 'PAN-456789', verified: 'Yes', vat: 'VAT-012345', vatVerified: 'Yes', status: 'Compliant' },
  { restaurant: 'Langtang Lodge', pan: 'PAN-567890', verified: 'Yes', vat: 'VAT-123456', vatVerified: 'Yes', status: 'Compliant' },
  { restaurant: 'Kathmandu Cafe', pan: 'PAN-678901', verified: 'No', vat: 'N/A', vatVerified: 'Pending', status: 'Non-Compliant' },
  { restaurant: 'Dhulikhel Traditional', pan: 'PAN-789012', verified: 'Pending', vat: 'VAT-234567', vatVerified: 'Pending', status: 'Action Required' },
  { restaurant: 'Ilam Coffee & Kitchen', pan: 'PAN-890123', verified: 'No', vat: 'N/A', vatVerified: 'No', status: 'Non-Compliant' },
  { restaurant: 'Chitwan Wildlife Cafe', pan: 'PAN-901234', verified: 'Yes', vat: 'VAT-345678', vatVerified: 'Yes', status: 'Compliant' },
  { restaurant: 'Sagarmatha Palace', pan: 'PAN-012345', verified: 'Pending', vat: 'VAT-456789', vatVerified: 'Pending', status: 'Action Required' },
];

const documentVault = [
  { name: 'Legal Agreements', icon: FileSignature, count: 12, lastUpdated: '2026-06-10' },
  { name: 'ToS Acceptances', icon: ScrollText, count: 547, lastUpdated: '2026-06-15' },
  { name: 'Privacy Policy', icon: Shield, count: 8, lastUpdated: '2026-06-01' },
  { name: 'GDPR Records', icon: Database, count: 23, lastUpdated: '2026-06-12' },
];

const fraudData = [
  { type: 'Payment', restaurant: 'Nuwakot Dining', detail: 'Multiple failed card attempts from same IP', risk: 92, date: '2026-06-15' },
  { type: 'Failed Login', restaurant: 'Kathmandu Cafe', detail: '10 failed login attempts in 5 min', risk: 78, date: '2026-06-14' },
  { type: 'Fake Signup', restaurant: 'Rara Valley Kitchen', detail: 'Suspicious email domain + burner phone', risk: 85, date: '2026-06-13' },
  { type: 'Payment', restaurant: 'Manang Heritage', detail: 'Chargeback ratio exceeds 1% threshold', risk: 65, date: '2026-06-12' },
  { type: 'Failed Login', restaurant: 'Mustang Bistro', detail: 'Brute force attack detected', risk: 95, date: '2026-06-11' },
];

const exportData = [
  { requester: 'Ramesh Poudel', dataType: 'Transaction Logs', status: 'Completed', requestedDate: '2026-06-10' },
  { requester: 'Bhim Magar', dataType: 'Restaurant Analytics', status: 'Completed', requestedDate: '2026-06-08' },
  { requester: 'Priya Shakya', dataType: 'Invoice History', status: 'Pending', requestedDate: '2026-06-14' },
  { requester: 'Deepak Ale', dataType: 'Customer Data Export', status: 'Pending', requestedDate: '2026-06-15' },
  { requester: 'Tenzin Sherpa', dataType: 'Tax Documents', status: 'Completed', requestedDate: '2026-06-05' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Compliant: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    'Action Required': 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
    'Non-Compliant': 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30',
  };
  return <Badge className={`border text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
};

const VerifiedBadge = ({ status }: { status: string }) => {
  if (status === 'Yes') return <span className="flex items-center gap-1 text-[#12B877] text-xs"><CheckCircle className="h-3 w-3" /> Yes</span>;
  if (status === 'No') return <span className="flex items-center gap-1 text-[#DB3A3A] text-xs"><XCircle className="h-3 w-3" /> No</span>;
  return <span className="flex items-center gap-1 text-[#F4B740] text-xs"><Clock className="h-3 w-3" /> Pending</span>;
};

export default function AdminCompliance() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Compliance Dashboard</h1>
          <p className="text-sm text-[#768B80] mt-1">IRD compliance, document vault, fraud detection & data export</p>
        </div>
        <Badge variant="outline" className="border-[#12B877]/30 text-[#12B877] bg-[#12B877]/5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#12B877] mr-1.5 animate-pulse" />
          Auto-Sync Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-[#768B80] uppercase tracking-wider">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white tracking-tight">{kpi.value}</div>
              <p className="text-[11px] text-[#768B80] mt-0.5">{kpi.subtitle}</p>
              <div className="mt-3 h-1.5 rounded-full bg-[#1A231E] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${kpi.percentage}%`, backgroundColor: kpi.color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">PAN / VAT Verification</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">PAN</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Verified</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">VAT</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">VAT Verified</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {panVatData.map((row) => (
                <TableRow key={row.restaurant} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell><span className="text-sm font-medium text-white">{row.restaurant}</span></TableCell>
                  <TableCell><span className="text-xs text-[#768B80]">{row.pan}</span></TableCell>
                  <TableCell><VerifiedBadge status={row.verified} /></TableCell>
                  <TableCell><span className="text-xs text-[#768B80]">{row.vat}</span></TableCell>
                  <TableCell><VerifiedBadge status={row.vatVerified} /></TableCell>
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
            <ShieldCheck className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">Document Vault</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentVault.map((doc) => {
              const DocIcon = doc.icon;
              return (
                <div key={doc.name} className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B] hover:border-[#12B877]/30 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-[#12B877]/10 flex items-center justify-center mb-3">
                    <DocIcon className="h-4.5 w-4.5 text-[#12B877]" />
                  </div>
                  <p className="text-sm font-medium text-white">{doc.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">{doc.count}</p>
                  <p className="text-[10px] text-[#768B80] mt-1">Updated {formatRelativeTime(new Date(doc.lastUpdated))}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#DB3A3A]" />
            <CardTitle className="text-sm font-medium text-white">Fraud Detection</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Restaurant</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Detail</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Risk Score</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fraudData.map((row, i) => (
                <TableRow key={i} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell>
                    <Badge className={`border text-[10px] ${
                      row.type === 'Payment' ? 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30'
                        : row.type === 'Failed Login' ? 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30'
                        : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'
                    }`}>{row.type}</Badge>
                  </TableCell>
                  <TableCell><span className="text-sm text-white">{row.restaurant}</span></TableCell>
                  <TableCell><span className="text-xs text-[#768B80]">{row.detail}</span></TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-bold ${
                      row.risk >= 90 ? 'text-[#DB3A3A]' : row.risk >= 75 ? 'text-[#F4B740]' : 'text-[#F4B740]'
                    }`}>{row.risk}%</span>
                  </TableCell>
                  <TableCell><span className="text-xs text-[#768B80]">{formatDate(new Date(row.date))}</span></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#25332B] text-[#12B877] hover:bg-[#12B877]/10">
                      <Eye className="h-3 w-3 mr-1" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-[#12B877]" />
            <CardTitle className="text-sm font-medium text-white">Data Export Requests</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Requester</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Data Type</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Requested Date</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportData.map((row, i) => (
                <TableRow key={i} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell><span className="text-sm font-medium text-white">{row.requester}</span></TableCell>
                  <TableCell><span className="text-xs text-[#768B80]">{row.dataType}</span></TableCell>
                  <TableCell>
                    <Badge className={`border text-[10px] ${
                      row.status === 'Completed' ? 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30'
                        : 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30'
                    }`}>{row.status}</Badge>
                  </TableCell>
                  <TableCell><span className="text-xs text-[#768B80]">{formatDate(new Date(row.requestedDate))}</span></TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-7 text-[10px] border-[#25332B] ${
                        row.status === 'Completed'
                          ? 'text-[#12B877] hover:bg-[#12B877]/10'
                          : 'text-[#768B80] opacity-50 cursor-not-allowed'
                      }`}
                      disabled={row.status !== 'Completed'}
                    >
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
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
