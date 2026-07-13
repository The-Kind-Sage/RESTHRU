import type { MenuItemData } from "./types";
import { MenuPage } from "./MenuPage";
import { SectionHeader } from "./SectionHeader";
import { DishRow } from "./DishRow";

export function CategoryPage({
  title,
  kicker,
  items,
  pageNumber,
  activeFilter,
  tint = false,
  flow = false,
}: {
  title: string;
  kicker?: string;
  items: MenuItemData[];
  pageNumber?: number;
  activeFilter: string;
  tint?: boolean;
  flow?: boolean;
}) {
  const isDimmed = (item: MenuItemData) => {
    if (activeFilter === "all") return false;
    return !item.tags?.includes(activeFilter);
  };

  return (
    <MenuPage pageNumber={pageNumber} tint={tint} flow={flow}>
      <SectionHeader title={title} kicker={kicker} />

      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <DishRow key={item.id} item={item} dimmed={isDimmed(item)} />
        ))}
      </div>
    </MenuPage>
  );
}
