'use client';

import React, { memo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface NavGroupItem {
  label: string;
  href: string;
  Icon: React.ElementType;
  /** Optional so a sidebar's nav array can mix plain links and groups. */
  children?: { label: string; href: string }[];
}

/**
 * A collapsible sidebar section (e.g. Menu → Dishes / Category / Combo Offer).
 *
 * Shared by the owner and reception sidebars so the two portals expand, collapse
 * and highlight identically — the alternative was a second copy that would
 * quietly drift.
 */
export const NavGroup = memo(function NavGroup({
  item,
  collapsed,
  pathname,
}: {
  item: NavGroupItem;
  collapsed: boolean;
  pathname: string;
}) {
  const { Icon } = item;
  const children = item.children ?? [];

  // The group's own href is a prefix of its children's, so it must match
  // exactly — otherwise "Dishes" stays lit while you're on Category/Combo.
  const childActive = useCallback(
    (href: string) =>
      href === item.href
        ? pathname === item.href
        : pathname === href || pathname.startsWith(href + '/'),
    [pathname, item.href]
  );

  const groupActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const [open, setOpen] = useState(groupActive);

  // Keep the group open whenever one of its routes is active.
  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  // Collapsed (icons-only) rail: the group icon just links to the first child.
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={children[0]?.href ?? item.href} prefetch={true}>
            <div
              className={cn(
                'group flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-150 cursor-pointer',
                groupActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
              )}
            >
              <Icon className="flex-shrink-0 h-[18px] w-[18px]" />
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150',
          groupActive
            ? 'text-white'
            : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
        )}
      >
        <Icon
          className={cn(
            'flex-shrink-0 h-[18px] w-[18px]',
            groupActive ? 'text-white' : 'text-white/50 group-hover:text-white'
          )}
        />
        <span className="flex-1 text-left text-[13px] font-medium whitespace-nowrap leading-none">
          {item.label}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-transform duration-200',
            open ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5 pl-3">
          {children.map((child) => {
            const active = childActive(child.href);
            return (
              <Link key={child.href} href={child.href} prefetch={true}>
                <div
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg pl-4 pr-3 py-2 transition-all duration-150 cursor-pointer',
                    active
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full flex-shrink-0',
                      active ? 'bg-white' : 'bg-white/50'
                    )}
                  />
                  <span className="text-[13px] font-medium whitespace-nowrap leading-none">
                    {child.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default NavGroup;
