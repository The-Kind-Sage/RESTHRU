'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RestaurantDetail() {
  const params = useParams();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/restaurants">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Restaurant Details</h1>
            <p className="text-sm text-muted-foreground mt-1">Restaurant ID: {params.id}</p>
          </div>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="text-center py-12 text-muted-foreground text-sm">No restaurant data available</div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-muted border border-border w-full justify-start overflow-auto flex-nowrap h-auto p-1 gap-0">
          {['orders', 'payments', 'staff', 'tables', 'subscription', 'tickets', 'documents', 'audit'].map((tab) => (
            <TabsTrigger key={tab} value={tab}
              className="text-xs px-4 py-2 text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-md capitalize whitespace-nowrap"
            >
              {tab === 'subscription' ? 'Subscription' : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-muted-foreground text-sm">No order history available</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-muted-foreground text-sm">No payment history available</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-muted-foreground text-sm">No staff data available</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-muted-foreground text-sm">No table data available</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-muted-foreground text-sm">No subscription data available</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-muted-foreground text-sm">No support tickets available</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-muted-foreground text-sm">No documents available</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-12 text-muted-foreground text-sm">No audit trail available</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
