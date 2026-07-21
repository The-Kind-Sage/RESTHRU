import { getBookMenuData } from '@/lib/actions/public-menu';
import { MenuBook } from '@/components/menu-book/MenuBook';

// Always render fresh so an owner's settings change (hours, phone, website,
// email) shows on the menu book immediately, with no stale full-route cache.
export const dynamic = 'force-dynamic';

export default async function RestaurantMenuPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const data = await getBookMenuData(restaurantId);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-lg font-semibold text-foreground">Restaurant not found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t find a restaurant at this link. It may have been removed, or the QR
          code / link may be incorrect.
        </p>
        <div className="flex gap-3">
          <a
            href={`/r/${restaurantId}`}
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Try Again
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return <MenuBook data={data} />;
}
