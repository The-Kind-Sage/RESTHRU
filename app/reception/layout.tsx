import { Suspense } from 'react';
import ReceptionShell from './shell';

export default function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReceptionShell>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </ReceptionShell>
  );
}
