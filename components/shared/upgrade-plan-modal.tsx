'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUpgradeStore } from '@/store/upgrade-store';
import { RESOURCE_META } from '@/lib/plan-limits';

// Global upgrade popup. Mounted once inside each authenticated shell; opens
// whenever a server action reports a plan-limit hit via useUpgradeStore.show().
export function UpgradePlanModal() {
  const { open, info, close } = useUpgradeStore();

  if (!info) return null;

  const meta = RESOURCE_META[info.resource];
  const suggestedText =
    info.suggestedLimit === null
      ? `unlimited ${meta.nounPlural}`
      : `up to ${info.suggestedLimit} ${meta.nounPlural}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden">
        {/* Accent header */}
        <div className="bg-gradient-to-br from-primary via-primary-hover to-[#064e3b] px-6 pt-6 pb-8 text-white">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-xl font-bold text-white">
              You&apos;ve reached your {info.currentPlanLabel} plan limit
            </DialogTitle>
            <DialogDescription className="text-sm text-white/85">
              The {info.currentPlanLabel} plan includes up to{' '}
              <span className="font-semibold text-white">
                {info.limit} {meta.nounPlural}
              </span>
              . You&apos;re using all {info.current} of them.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Upgrade to {info.suggestedPlanLabel}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
              <Check className="h-4 w-4 flex-shrink-0 text-primary" />
              Add {suggestedText}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
              <Check className="h-4 w-4 flex-shrink-0 text-primary" />
              Keep everything you already have
            </p>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close} className="sm:w-auto">
              Maybe later
            </Button>
            <Link href="/pricing" onClick={close} className="sm:w-auto">
              <Button className="group w-full bg-primary text-white hover:bg-primary-hover">
                See plans
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
