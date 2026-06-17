'use client';

import { Star } from 'lucide-react';

const restaurants = [
  'Himalayan Kitchen',
  'Thakali House',
  'Newari Delights',
  'Kathmandu Cafe',
  'Pokhara Grill',
];

export function SocialProofBar() {
  return (
    <section className="border-y border-border bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main trust statement */}
        <div className="text-center mb-8">
          <p className="text-lg sm:text-xl font-semibold text-foreground">
            Trusted by 500+ restaurants across Nepal
          </p>
        </div>

        {/* Restaurant names */}
        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 mb-8">
          {restaurants.map((restaurant, index) => (
            <div key={index} className="text-sm sm:text-base text-muted-foreground">
              {restaurant}
            </div>
          ))}
        </div>

        {/* Star rating */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 fill-accent text-accent"
              />
            ))}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">4.9/5</span> from 200+ reviews
          </p>
        </div>
      </div>
    </section>
  );
}
