'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ReceptionSidebar from '@/components/dashboard/reception-sidebar';
import TopHeader from '@/components/dashboard/top-header';
import IdleTimeoutGuard from '@/components/dashboard/idle-timeout-guard';
import OfflineBanner from '@/components/dashboard/offline-banner';
import SyncIndicator from '@/components/dashboard/sync-indicator';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { startSync, stopSync } from '@/lib/sync';

export default function ReceptionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUIStore();
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    startSync();
    return () => stopSync();
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <IdleTimeoutGuard />
      <OfflineBanner />
      <ReceptionSidebar />
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[248px]'
        )}
      >
        <TopHeader />
        <div className="fixed top-0 right-4 mt-4 z-50">
          <SyncIndicator />
        </div>
        <main className="flex-1 overflow-auto pt-20">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
