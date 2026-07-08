import { getBookMenuData } from '@/lib/actions/public-menu';
import { MenuBook } from '@/components/menu-book/MenuBook';

export default async function RestaurantMenuPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const data = await getBookMenuData(restaurantId);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Restaurant not found.</p>
      </div>
    );
  }

  return <MenuBook data={data} />;
}
