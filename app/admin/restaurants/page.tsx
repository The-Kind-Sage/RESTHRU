'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminRestaurants() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Restaurant Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all restaurants on the platform</p>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-muted-foreground text-sm">No restaurants found</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
