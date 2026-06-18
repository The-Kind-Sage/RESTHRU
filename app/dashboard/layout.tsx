// Server Component — no 'use client' directive.
// The sidebar and header are Client Components rendered inside, but
// keeping the layout itself as a Server Component enables streaming and
// prevents the entire shell from being included in the client JS bundle.
import { Suspense } from 'react';
import DashboardShell from './shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Shell is a Client Component that owns sidebar + header state.
    // Wrapping children in Suspense lets each sub-page stream independently
    // so the sidebar appears immediately while page data is still loading.
    <DashboardShell>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </DashboardShell>
  );
}
