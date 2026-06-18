'use client';

import { useEffect } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import TopHeader from '@/components/dashboard/top-header';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

// This is the only Client Component in the layout chain.
// It owns sidebar collapse state and auth init — both need the browser.
// By isolating it here, the parent layout.tsx stays a Server Component
// and children can stream independently.
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[248px]'
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
