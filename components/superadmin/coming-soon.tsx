import { Construction } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Shared "coming soon" placeholder for superadmin sections that are large,
 * unbuilt subsystems (Document Vault, Fraud Detection, Data Export Requests,
 * Experiment Tracking, Roadmap Voting, A/B Testing, Knowledge Base, Restaurant
 * Documents). Deliberately styled differently from a genuinely-empty real
 * section (dashed border, muted icon, explicit "Planned" badge) so it can't be
 * mistaken for "this list is empty right now" (G3/G4).
 */
export function ComingSoon({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 text-center py-10 rounded-lg border border-dashed border-border bg-muted/20 ${className}`}
    >
      <Construction className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
      <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
        Coming soon
      </Badge>
      <p className="text-xs text-muted-foreground max-w-sm px-4">{message}</p>
    </div>
  );
}
