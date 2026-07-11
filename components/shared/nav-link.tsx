'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  Icon: React.ElementType;
}

interface SharedNavLinkProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}

export const SharedNavLink = memo(function SharedNavLink({
  item,
  active,
  collapsed,
}: SharedNavLinkProps) {
  const { Icon } = item;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={item.href} prefetch={true}>
          <div
            className={cn(
              'group flex items-center gap-3 rounded-lg transition-all duration-150 cursor-pointer',
              collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5',
              active
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
            )}
          >
            <Icon
              className={cn(
                'flex-shrink-0 h-[18px] w-[18px]',
                active ? 'text-white' : 'text-white/50 group-hover:text-white'
              )}
            />
            {!collapsed && (
              <span className="text-[13px] font-medium whitespace-nowrap leading-none">
                {item.label}
              </span>
            )}
          </div>
        </Link>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      )}
    </Tooltip>
  );
});
