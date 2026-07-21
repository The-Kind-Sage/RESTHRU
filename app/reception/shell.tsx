'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ReceptionSidebar from '@/components/dashboard/reception-sidebar';
import TopHeader from '@/components/dashboard/top-header';
import IdleTimeoutGuard from '@/components/dashboard/idle-timeout-guard';
import OfflineBanner from '@/components/dashboard/offline-banner';
import { UpgradePlanModal } from '@/components/shared/upgrade-plan-modal';
import { NotificationSound } from '@/components/shared/notification-sound';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { startSync, stopSync } from '@/lib/sync';
import { registerServiceWorker } from '@/lib/service-worker';

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
    registerServiceWorker();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <IdleTimeoutGuard />
      <OfflineBanner />
      <UpgradePlanModal />
      <NotificationSound />
      <ReceptionSidebar />
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ml-0',
          sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-[248px]'
        )}
      >
        <TopHeader />
        <main className="flex-1 overflow-auto pt-20">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
