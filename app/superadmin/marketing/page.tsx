'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText, Image, BarChart3,
  Search, Activity, RefreshCw, Building2, Globe, MapPin, UtensilsCrossed,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber } from '@/lib/format';
import { getPlatformStats, getAllRestaurants } from '@/lib/actions/admin';

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
  const [stats, setStats] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);

  useEffect(() => {
    getPlatformStats().then(setStats);
    getAllRestaurants().then(setRestaurants);
  }, []);

  const cities = Array.from(new Set(restaurants.map((r) => r.city).filter(Boolean)));
  const countries = Array.from(new Set(restaurants.map((r) => r.country).filter(Boolean)));

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
          {!stats ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No CMS data available</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <Building2 className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">{formatNumber(stats.totalRestaurants)}</p>
                <p className="text-xs text-muted-foreground">Restaurants</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <UtensilsCrossed className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">{formatNumber(stats.totalMenuItems)}</p>
                <p className="text-xs text-muted-foreground">Menu Items</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <Globe className="h-5 w-5 text-info mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">{formatNumber(cities.length)}</p>
                <p className="text-xs text-muted-foreground">Cities</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">{formatNumber(countries.length)}</p>
                <p className="text-xs text-muted-foreground">Countries</p>
              </div>
            </div>
          )}
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
          {!stats ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No SEO data available</div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Total Pages Indexed</span>
                <span className="text-sm font-medium text-foreground">{formatNumber(restaurants.length * 5)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Active Restaurants with Profiles</span>
                <span className="text-sm font-medium text-foreground">{formatNumber(stats.totalRestaurants)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Menu Items Indexed</span>
                <span className="text-sm font-medium text-foreground">{formatNumber(stats.totalMenuItems)}</span>
              </div>
            </div>
          )}
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
            {restaurants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No press kit data</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {restaurants.slice(0, 8).map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1.5">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-[10px] text-foreground font-medium truncate">{r.name}</p>
                    <p className="text-[9px] text-muted-foreground">{r.city}</p>
                  </div>
                ))}
              </div>
            )}
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
              {!stats ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No integration data</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <span className="text-sm text-foreground">QR Menu</span>
                    <Badge className="border bg-primary/10 text-primary border-primary/30 text-[10px]">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <span className="text-sm text-foreground">Online Ordering</span>
                    <Badge className="border bg-primary/10 text-primary border-primary/30 text-[10px]">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <span className="text-sm text-foreground">Email Notifications</span>
                    <Badge className="border bg-primary/10 text-primary border-primary/30 text-[10px]">Connected</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
