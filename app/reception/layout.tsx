import { Suspense } from 'react';
import ReceptionShell from './shell';
import { PageSkeleton } from '@/components/shared/page-skeleton';

export default function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReceptionShell>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </ReceptionShell>
  );
}
