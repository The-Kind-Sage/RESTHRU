import type { ReactNode } from "react";

/**
 * Unified page header used across every authenticated surface (superadmin,
 * dashboard, reception). Replaces the hand-rolled
 * `<div className="flex items-center justify-between"><h1 …><p …></div>` block
 * that was copy-pasted into ~20 pages with slightly different spacing.
 *
 * On mobile the title and actions stack vertically (they used to overflow / get
 * cramped side-by-side); from `sm` up they sit on one row.
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned actions (buttons, badges, filters). */
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}
