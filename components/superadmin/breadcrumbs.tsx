'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const LABELS: Record<string, string> = {
  '/superadmin': 'Dashboard',
  '/superadmin/restaurants': 'Restaurants',
  '/superadmin/owners': 'Owner Management',
  '/superadmin/menu': 'Menu Management',
  '/superadmin/subscriptions': 'Subscriptions',
  '/superadmin/analytics': 'Analytics',
  '/superadmin/support': 'Support Center',
  '/superadmin/health': 'System Health',
  '/superadmin/pipeline': 'Sales Pipeline',
  '/superadmin/marketing': 'Marketing Tools',
  '/superadmin/compliance': 'Compliance',
  '/superadmin/financials': 'Financials',
  '/superadmin/innovation': 'Innovation Lab',
  '/superadmin/settings': 'Settings',
};

// C1 — there were no breadcrumbs anywhere in this 13-page section. This is
// mounted once in app/superadmin/layout.tsx so every page gets a trail for
// free instead of 13 per-page implementations.
export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const params = useParams();

  if (pathname === '/superadmin/login') return null;

  // Longest-prefix match against known section roots.
  const sectionEntry = Object.entries(LABELS)
    .filter(([href]) => href !== '/superadmin' && pathname.startsWith(href))
    .sort((a, b) => b[0].length - a[0].length)[0];

  const crumbs: { label: string; href?: string }[] = [{ label: 'Admin', href: '/superadmin' }];

  if (pathname === '/superadmin') {
    // Root — just "Admin / Dashboard", second crumb not a link.
    crumbs.push({ label: 'Dashboard' });
  } else if (sectionEntry) {
    const [href, label] = sectionEntry;
    const isDetail = params?.id && pathname !== href;
    crumbs.push({ label, href: isDetail ? href : undefined });
    if (isDetail) {
      crumbs.push({ label: 'Restaurant Details' });
    }
  } else {
    crumbs.push({ label: 'Dashboard' });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
      <Home className="h-3 w-3 flex-shrink-0" />
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5 min-w-0">
          {i > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-foreground transition-colors truncate">
              {crumb.label}
            </Link>
          ) : (
            <span className={`truncate ${i === crumbs.length - 1 ? 'text-foreground font-medium' : ''}`}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
