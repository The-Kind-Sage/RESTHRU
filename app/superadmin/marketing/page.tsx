'use client';

import { PageHeader } from '@/components/shared/page-header';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search, Building2, Globe, MapPin, UtensilsCrossed,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber } from '@/lib/format';
import { getPlatformStats, getAllRestaurants } from '@/lib/actions/admin';

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
      <PageHeader title="Marketing Tools" description="Manage CMS, SEO, press kit, and growth experiments">
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          Live Site
        </Badge>
      </PageHeader>

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
            <Tabs value={cmsTab} className="w-full">
              <TabsContent value="all" className="mt-0">
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
              </TabsContent>
              <TabsContent value="published" className="mt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <Building2 className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-lg font-bold text-foreground">{formatNumber(stats.totalRestaurants)}</p>
                    <p className="text-xs text-muted-foreground">Active Restaurants</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <UtensilsCrossed className="h-5 w-5 text-accent mx-auto mb-2" />
                    <p className="text-lg font-bold text-foreground">{formatNumber(stats.totalMenuItems)}</p>
                    <p className="text-xs text-muted-foreground">Published Menu Items</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <FileText className="h-5 w-5 text-info mx-auto mb-2" />
                    <p className="text-lg font-bold text-foreground">{formatNumber(stats.totalOrders)}</p>
                    <p className="text-xs text-muted-foreground">Orders Placed</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="draft" className="mt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <Globe className="h-5 w-5 text-info mx-auto mb-2" />
                    <p className="text-lg font-bold text-foreground">{formatNumber(cities.length)}</p>
                    <p className="text-xs text-muted-foreground">Active Cities</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-lg font-bold text-foreground">{formatNumber(countries.length)}</p>
                    <p className="text-xs text-muted-foreground">Countries</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <Building2 className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-lg font-bold text-foreground">{formatNumber(restaurants.length)}</p>
                    <p className="text-xs text-muted-foreground">Total Restaurants</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-info" />
            <CardTitle className="text-sm font-medium text-foreground">Public Presence</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Public-facing profiles and menus across the platform</p>
        </CardHeader>
        <CardContent>
          {!stats ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Active Restaurants with Profiles</span>
                <span className="text-sm font-medium text-foreground">{formatNumber(stats.totalRestaurants)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-foreground">Menu Items on Public Menus</span>
                <span className="text-sm font-medium text-foreground">{formatNumber(stats.totalMenuItems)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
