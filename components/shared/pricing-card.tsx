'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: number | null;
  yearlyPrice: number | null;
  features: string[];
  isPopular: boolean;
  accentColor: 'indigo' | 'emerald' | 'amber' | 'gray';
  ctaText: string;
  isYearly: boolean;
}

const accentColorMap = {
  indigo: 'border-primary bg-primary-light',
  emerald: 'border-primary bg-primary-light',
  amber: 'border-accent bg-accent-light',
  gray: 'border-border bg-muted',
};

const accentBgMap = {
  indigo: 'bg-primary',
  emerald: 'bg-primary',
  amber: 'bg-accent',
  gray: 'bg-muted-foreground',
};

const buttonVariantMap = {
  indigo: 'default',
  emerald: 'default',
  amber: 'default',
  gray: 'outline',
} as const;

export function PricingCard({
  name,
  price,
  yearlyPrice,
  features,
  isPopular,
  accentColor,
  ctaText,
  isYearly,
}: PricingCardProps) {
  const displayPrice = isYearly ? yearlyPrice : price;
  const formattedPrice =
    displayPrice === null
      ? 'Custom'
      : displayPrice === 0
        ? 'NPR 0'
        : `NPR ${displayPrice.toLocaleString('en-US')}`;

  const priceLabel = displayPrice === null ? '' : isYearly ? '/year' : '/month';

  return (
    <div className={cn('relative h-full', isPopular && 'md:scale-105')}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
          <Badge variant="default" className="bg-primary">
            Most Popular
          </Badge>
        </div>
      )}
      <Card
        className={cn(
          'relative flex h-full flex-col border-t-4 transition-all duration-300',
          accentColorMap[accentColor],
          isPopular && 'shadow-lg ring-2 ring-primary/20'
        )}
      >
        <div className={cn('h-1 w-full', accentBgMap[accentColor])} />
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl">{name}</CardTitle>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold">{formattedPrice}</span>
            {priceLabel && <span className="text-sm text-muted-foreground">{priceLabel}</span>}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div className="mb-6 space-y-3">
            {features.map((feature, idx) => {
              const isExcluded = feature.startsWith('✗');
              const displayFeature = isExcluded ? feature.slice(1).trim() : feature;

              return (
                <div key={idx} className="flex items-start gap-3">
                  {isExcluded ? (
                    <X className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                  ) : (
                    <Check className="h-5 w-5 shrink-0 text-success mt-0.5" />
                  )}
                  <span className={cn('text-sm', isExcluded && 'text-muted-foreground')}>
                    {displayFeature}
                  </span>
                </div>
              );
            })}
          </div>

          <Button
            className="mt-auto w-full"
            variant={buttonVariantMap[accentColor]}
            size="lg"
          >
            {ctaText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
