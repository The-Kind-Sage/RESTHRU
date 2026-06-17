'use client';

import React, { useState } from 'react';
import {
  FileText, Image, Download, ExternalLink, BarChart3,
  Search, Edit, CheckCircle, XCircle, Activity,
  Globe, Facebook, PieChart, Link, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { formatDate, formatRelativeTime } from '@/lib/format';

interface CMSEntry {
  id: number;
  name: string;
  type: string;
  status: string;
  lastUpdated: string;
  author: string;
}

const cmsData: CMSEntry[] = [
  { id: 1, name: 'Homepage Hero', type: 'Landing Page', status: 'Published', lastUpdated: '2026-06-15', author: 'Marketing Team' },
  { id: 2, name: 'Pricing & Plans', type: 'Pricing Page', status: 'Published', lastUpdated: '2026-06-10', author: 'Marketing Team' },
  { id: 3, name: 'How It Works', type: 'Landing Page', status: 'Draft', lastUpdated: '2026-06-16', author: 'Content Team' },
  { id: 4, name: 'Why Resthru Blog', type: 'Blog Posts', status: 'Published', lastUpdated: '2026-06-12', author: 'Content Team' },
  { id: 5, name: 'Nepal Restaurant Trends 2026', type: 'Blog Posts', status: 'Draft', lastUpdated: '2026-06-17', author: 'Content Team' },
  { id: 6, name: 'Pokhara Grill Case Study', type: 'Case Studies', status: 'Published', lastUpdated: '2026-06-08', author: 'Marketing Team' },
  { id: 7, name: 'Langtang Lodge Success Story', type: 'Case Studies', status: 'Draft', lastUpdated: '2026-06-14', author: 'Marketing Team' },
  { id: 8, name: 'Restaurant Owner Testimonials', type: 'Testimonials', status: 'Published', lastUpdated: '2026-06-05', author: 'Content Team' },
];

interface SEOEntry {
  id: number;
  page: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: boolean;
  lastEdited: string;
}

const seoData: SEOEntry[] = [
  { id: 1, page: '/', metaTitle: 'Resthru - Restaurant Management Platform Nepal', metaDescription: 'Digital ordering, POS, and management platform for Nepali restaurants.', ogImage: true, lastEdited: '2026-06-15' },
  { id: 2, page: '/pricing', metaTitle: 'Pricing - Resthru', metaDescription: 'Affordable plans for restaurants of all sizes in Nepal.', ogImage: true, lastEdited: '2026-06-10' },
  { id: 3, page: '/features', metaTitle: 'Features - Resthru', metaDescription: 'Explore powerful features for your restaurant.', ogImage: false, lastEdited: '2026-06-12' },
  { id: 4, page: '/about', metaTitle: 'About Us - Resthru', metaDescription: 'Learn about Resthru and our mission to digitize Nepali restaurants.', ogImage: true, lastEdited: '2026-06-08' },
  { id: 5, page: '/blog', metaTitle: null, metaDescription: null, ogImage: false, lastEdited: '2026-06-01' },
  { id: 6, page: '/contact', metaTitle: 'Contact - Resthru', metaDescription: 'Get in touch with our team.', ogImage: false, lastEdited: '2026-05-28' },
];

interface PressKitItem {
  id: number;
  name: string;
  type: string;
  size: string;
  format: string;
}

const pressKitData: PressKitItem[] = [
  { id: 1, name: 'Resthru Logo (PNG)', type: 'logo', size: '2.4 MB', format: 'PNG' },
  { id: 2, name: 'Resthru Logo (SVG)', type: 'logo', size: '124 KB', format: 'SVG' },
  { id: 3, name: 'Logo with Tagline', type: 'logo', size: '1.8 MB', format: 'PNG' },
  { id: 4, name: 'Brand Guidelines PDF', type: 'guidelines', size: '8.5 MB', format: 'PDF' },
  { id: 5, name: 'Color Palette', type: 'guidelines', size: '456 KB', format: 'PDF' },
  { id: 6, name: 'Typography Guide', type: 'guidelines', size: '320 KB', format: 'PDF' },
  { id: 7, name: 'Dashboard Screenshot', type: 'screenshot', size: '3.2 MB', format: 'PNG' },
  { id: 8, name: 'Mobile App Screenshot', type: 'screenshot', size: '2.8 MB', format: 'PNG' },
  { id: 9, name: 'Feature Mockup Bundle', type: 'screenshot', size: '12.6 MB', format: 'ZIP' },
];

interface ABTestEntry {
  id: number;
  name: string;
  variantA: string;
  variantB: string;
  impressions: number;
  conversionRate: number;
  winner: string;
}

const abTestData: ABTestEntry[] = [
  { id: 1, name: 'Hero CTA Button', variantA: 'Get Started Free', variantB: 'Start Your Trial', impressions: 12450, conversionRate: 3.2, winner: 'A' },
  { id: 2, name: 'Pricing Card Layout', variantA: 'Grid with features', variantB: 'Comparison table', impressions: 8700, conversionRate: 4.8, winner: 'B' },
  { id: 3, name: 'Signup Form Length', variantA: '3 fields', variantB: '6 fields', impressions: 15200, conversionRate: 5.1, winner: 'A' },
  { id: 4, name: 'Testimonial Placement', variantA: 'Above fold', variantB: 'Below features', impressions: 6300, conversionRate: 2.9, winner: 'Pending' },
  { id: 5, name: 'Trial Duration Copy', variantA: '14-day free trial', variantB: 'Try free for 2 weeks', impressions: 10100, conversionRate: 3.7, winner: 'Pending' },
];

interface IntegrationEntry {
  name: string;
  icon: React.ElementType;
  status: string;
  lastSync: string;
}

const integrationData: IntegrationEntry[] = [
  { name: 'Google Analytics', icon: BarChart3, status: 'Connected', lastSync: '2 min ago' },
  { name: 'Facebook Pixel', icon: Facebook, status: 'Connected', lastSync: '15 min ago' },
  { name: 'Mixpanel', icon: PieChart, status: 'Not Connected', lastSync: '--' },
];

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    Published: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
    Draft: 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30',
  };
  return colors[status] || 'bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30';
};

const integrationStatusColors: Record<string, string> = {
  Connected: 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30',
  'Not Connected': 'bg-[#DB3A3A]/10 text-[#DB3A3A] border-[#DB3A3A]/30',
};

const cmsIcons: Record<string, React.ElementType> = {
  'Landing Page': FileText,
  'Pricing Page': FileText,
  'Blog Posts': FileText,
  'Case Studies': FileText,
  'Testimonials': FileText,
};

export default function AdminMarketing() {
  const [cmsTab, setCmsTab] = useState('all');

  const filteredCMS = cmsTab === 'all' ? cmsData : cmsData.filter((c) => {
    if (cmsTab === 'published') return c.status === 'Published';
    if (cmsTab === 'draft') return c.status === 'Draft';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Marketing Tools</h1>
          <p className="text-sm text-[#768B80] mt-1">Manage CMS, SEO, press kit, and growth experiments</p>
        </div>
        <Badge variant="outline" className="border-[#12B877]/30 text-[#12B877] bg-[#12B877]/5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#12B877] mr-1.5 animate-pulse" />
          Live Site
        </Badge>
      </div>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#12B877]" />
              <CardTitle className="text-sm font-medium text-white">CMS Overview</CardTitle>
            </div>
            <p className="text-xs text-[#768B80] mt-0.5">Manage website content and pages</p>
          </div>
          <Tabs value={cmsTab} onValueChange={setCmsTab} className="w-auto">
            <TabsList className="bg-[#1A231E] border border-[#25332B] h-8">
              <TabsTrigger value="all" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">All</TabsTrigger>
              <TabsTrigger value="published" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">Published</TabsTrigger>
              <TabsTrigger value="draft" className="text-[10px] px-3 py-1 data-[state=active]:bg-[#12B877]/20 data-[state=active]:text-[#12B877]">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Landing Page', 'Pricing Page', 'Blog Posts', 'Case Studies', 'Testimonials'].map((type) => {
              const items = cmsData.filter((c) => c.type === type);
              const published = items.filter((c) => c.status === 'Published').length;
              const Icon = cmsIcons[type] || FileText;
              return (
                <div key={type} className="p-4 rounded-lg bg-[#1A231E]/50 border border-[#25332B] hover:border-[#12B877]/20 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-[#12B877]/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-[#12B877]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{type}</p>
                      <p className="text-[10px] text-[#768B80]">{items.length} entries</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="border text-[10px] bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30">{published} Published</Badge>
                      {items.length - published > 0 && (
                        <Badge className="border text-[10px] bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30">{items.length - published} Draft</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-[#768B80]">
                      Updated {formatRelativeTime(items.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0]?.lastUpdated || '')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#3B82F6]" />
              <CardTitle className="text-sm font-medium text-white">SEO Tools</CardTitle>
            </div>
            <p className="text-xs text-[#768B80] mt-0.5">Meta tags and search optimization for public pages</p>
          </div>
          <Button variant="outline" size="sm" className="border-[#25332B] text-[#768B80] hover:text-white">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reindex
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#25332B] hover:bg-transparent">
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Page</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Meta Title</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Meta Description</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-center">OG Image</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Last Edited</TableHead>
                <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seoData.map((entry) => (
                <TableRow key={entry.id} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-[#768B80]" />
                      <span className="text-sm font-medium text-white">{entry.page}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs ${entry.metaTitle ? 'text-white/70' : 'text-[#DB3A3A] italic'}`}>
                      {entry.metaTitle || 'Not set'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs ${entry.metaDescription ? 'text-white/70' : 'text-[#DB3A3A] italic'}`}>
                      {entry.metaDescription || 'Not set'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.ogImage ? (
                      <CheckCircle className="h-4 w-4 text-[#12B877] mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#DB3A3A] mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-[#768B80]">{formatDate(entry.lastEdited)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-[#12B877] hover:bg-[#12B877]/10">
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-[#F4B740]" />
              <CardTitle className="text-sm font-medium text-white">Press Kit</CardTitle>
            </div>
            <p className="text-xs text-[#768B80] mt-0.5">Brand assets, logos, and screenshots</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-medium text-[#768B80] uppercase tracking-wider mb-2">Logos</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {pressKitData.filter((p) => p.type === 'logo').map((item) => (
                    <div key={item.id} className="p-3 rounded-lg bg-[#1A231E]/50 border border-[#25332B] hover:border-[#12B877]/20 transition-colors">
                      <div className="h-12 w-full rounded bg-[#0D1711] flex items-center justify-center mb-2 border border-[#25332B]">
                        <span className="text-lg font-bold text-[#12B877]">R</span>
                      </div>
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-[#768B80]">{item.size} · {item.format}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#12B877] hover:bg-[#12B877]/10">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-[#768B80] uppercase tracking-wider mb-2">Brand Guidelines</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {pressKitData.filter((p) => p.type === 'guidelines').map((item) => (
                    <div key={item.id} className="p-3 rounded-lg bg-[#1A231E]/50 border border-[#25332B] hover:border-[#12B877]/20 transition-colors">
                      <div className="h-12 w-full rounded bg-[#0D1711] flex items-center justify-center mb-2 border border-[#25332B]">
                        <FileText className="h-5 w-5 text-[#F4B740]" />
                      </div>
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-[#768B80]">{item.size} · {item.format}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#12B877] hover:bg-[#12B877]/10">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-[#768B80] uppercase tracking-wider mb-2">Screenshots</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {pressKitData.filter((p) => p.type === 'screenshot').map((item) => (
                    <div key={item.id} className="p-3 rounded-lg bg-[#1A231E]/50 border border-[#25332B] hover:border-[#12B877]/20 transition-colors">
                      <div className="h-12 w-full rounded bg-[#0D1711] flex items-center justify-center mb-2 border border-[#25332B]">
                        <Image className="h-5 w-5 text-[#3B82F6]" />
                      </div>
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-[#768B80]">{item.size} · {item.format}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#12B877] hover:bg-[#12B877]/10">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[#0D1711] border-[#25332B] shadow-admin-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#3B82F6]" />
                <CardTitle className="text-sm font-medium text-white">A/B Testing</CardTitle>
              </div>
              <p className="text-xs text-[#768B80] mt-0.5">Conversion experiments and results</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#25332B] hover:bg-transparent">
                    <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Test</TableHead>
                    <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Variant A</TableHead>
                    <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider">Variant B</TableHead>
                    <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Impressions</TableHead>
                    <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-right">Conv. Rate</TableHead>
                    <TableHead className="text-[#768B80] text-xs font-medium uppercase tracking-wider text-center">Winner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abTestData.map((test) => (
                    <TableRow key={test.id} className="border-[#25332B] hover:bg-[#1A231E]/50 transition-colors">
                      <TableCell>
                        <p className="text-xs font-medium text-white">{test.name}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] text-white/60 bg-[#1A231E] px-2 py-0.5 rounded border border-[#25332B]">{test.variantA}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] text-white/60 bg-[#1A231E] px-2 py-0.5 rounded border border-[#25332B]">{test.variantB}</span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-white/70">{test.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs text-white/70">{test.conversionRate}%</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`border text-[10px] ${
                          test.winner === 'A' ? 'bg-[#12B877]/10 text-[#12B877] border-[#12B877]/30'
                            : test.winner === 'B' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'
                            : 'bg-[#F4B740]/10 text-[#F4B740] border-[#F4B740]/30'
                        }`}>
                          {test.winner === 'Pending' ? 'Pending' : `Variant ${test.winner}`}
                        </Badge>
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
                <Activity className="h-4 w-4 text-[#12B877]" />
                <CardTitle className="text-sm font-medium text-white">Integration Status</CardTitle>
              </div>
              <p className="text-xs text-[#768B80] mt-0.5">Marketing tool connectivity</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integrationData.map((integration) => {
                  const IntIcon = integration.icon;
                  return (
                    <div
                      key={integration.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#1A231E]/50 border border-[#25332B] hover:border-[#12B877]/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#0D1711] border border-[#25332B] flex items-center justify-center">
                          <IntIcon className="h-4 w-4 text-[#768B80]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{integration.name}</p>
                          <p className="text-[10px] text-[#768B80]">Last sync: {integration.lastSync}</p>
                        </div>
                      </div>
                      <Badge className={`border text-[10px] ${integrationStatusColors[integration.status] || 'bg-[#768B80]/10 text-[#768B80] border-[#768B80]/30'}`}>
                        {integration.status === 'Connected' ? (
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                        ) : (
                          <XCircle className="h-2.5 w-2.5 mr-1" />
                        )}
                        {integration.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
