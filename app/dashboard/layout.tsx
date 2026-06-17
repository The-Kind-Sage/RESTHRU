'use client';

import { useEffect } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import TopHeader from '@/components/dashboard/top-header';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth on mount
    initialize();
  }, [initialize]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        )}
      >
        {/* Top Header */}
        <TopHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-auto pt-20">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
