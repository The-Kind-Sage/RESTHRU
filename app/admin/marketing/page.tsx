'use client';

import React, { useState } from 'react';
import {
  FileText, Image, BarChart3,
  Search, Activity, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    Published: 'bg-primary/10 text-primary border-primary/30',
    Draft: 'bg-accent/10 text-accent border-accent/30',
  };
  return colors[status] || 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30';
};

const integrationStatusColors: Record<string, string> = {
  Connected: 'bg-primary/10 text-primary border-primary/30',
  'Not Connected': 'bg-destructive/10 text-destructive border-destructive/30',
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Marketing Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage CMS, SEO, press kit, and growth experiments</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          Live Site
        </Badge>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium text-foreground">CMS Overview</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Manage website content and pages</p>
          </div>
          <Tabs value={cmsTab} onValueChange={setCmsTab} className="w-auto">
            <TabsList className="bg-muted border border-border h-8">
              <TabsTrigger value="all" className="text-[10px] px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">All</TabsTrigger>
              <TabsTrigger value="published" className="text-[10px] px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Published</TabsTrigger>
              <TabsTrigger value="draft" className="text-[10px] px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">No CMS data available</div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-info" />
              <CardTitle className="text-sm font-medium text-foreground">SEO Tools</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Meta tags and search optimization for public pages</p>
          </div>
          <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reindex
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">No SEO data available</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-medium text-foreground">Press Kit</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Brand assets, logos, and screenshots</p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground text-sm">No press kit data</div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-info" />
                <CardTitle className="text-sm font-medium text-foreground">A/B Testing</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Conversion experiments and results</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground text-sm">No A/B test data</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium text-foreground">Integration Status</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Marketing tool connectivity</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground text-sm">No integration data</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
