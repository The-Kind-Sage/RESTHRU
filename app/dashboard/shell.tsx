'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/dashboard/sidebar';
import TopHeader from '@/components/dashboard/top-header';
import IdleTimeoutGuard from '@/components/dashboard/idle-timeout-guard';
import OfflineBanner from '@/components/dashboard/offline-banner';
import { UpgradePlanModal } from '@/components/shared/upgrade-plan-modal';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { startSync, stopSync } from '@/lib/sync';
import { DASHBOARD_AUTH_ROUTES } from '@/lib/constants';
import { registerServiceWorker } from '@/lib/service-worker';
import { cn } from '@/lib/utils';

export default function DashboardShell({
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

  const isPublicAuthRoute = DASHBOARD_AUTH_ROUTES.includes(pathname as typeof DASHBOARD_AUTH_ROUTES[number]);

  useEffect(() => {
    // Never install the SW on the login/reset pages — doing so would
    // precache an authenticated snapshot of /dashboard before the user
    // has even signed in.
    if (!isPublicAuthRoute) {
      registerServiceWorker();
    }
  }, [isPublicAuthRoute]);

  if (isPublicAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <IdleTimeoutGuard />
      <OfflineBanner />
      <UpgradePlanModal />
      <Sidebar />
      {/* Content: no left margin on mobile (sidebar is an overlay drawer);
          on md+ it clears the inline sidebar's collapsed/expanded width. */}
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
