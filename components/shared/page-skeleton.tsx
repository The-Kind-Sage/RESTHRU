import { Loader2 } from 'lucide-react';

export function PageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm font-medium">Loading...</p>
    </div>
  );
}
