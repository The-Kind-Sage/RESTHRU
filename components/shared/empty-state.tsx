import type { ComponentType, ReactNode } from "react";

/**
 * Consistent empty-state block for tables, lists and cards. Every page used to
 * render its own `<div className="text-center py-12 text-muted-foreground">…`
 * with slightly different copy sizes and icon treatments — this unifies them.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-4 py-12 text-center ${className}`}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
          <Icon className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.5} />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
