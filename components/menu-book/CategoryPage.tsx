import type { MenuItemData } from "./types";
import { MenuPage } from "./MenuPage";
import { SectionHeader } from "./SectionHeader";
import { DishRow } from "./DishRow";
import { FoodImage } from "./FoodImage";

export function CategoryPage({
  title,
  kicker,
  items,
  pageNumber,
  activeFilter,
  tint = false,
  signature,
}: {
  title: string;
  kicker?: string;
  items: MenuItemData[];
  pageNumber: number;
  activeFilter: string;
  tint?: boolean;
  signature?: MenuItemData;
}) {
  const isDimmed = (item: MenuItemData) => {
    if (activeFilter === "all") return false;
    return !item.tags?.includes(activeFilter);
  };

  return (
    <MenuPage pageNumber={pageNumber} tint={tint}>
      <SectionHeader title={title} kicker={kicker} />

      {signature && (
        <div
          className="mb-8 overflow-hidden rounded-lg border p-4"
          style={{ borderColor: "rgba(197,165,90,0.5)" }}
        >
          <div className="mb-3">
            <FoodImage src={signature.imageUrl} variant="featured" label="Signature Photo" />
          </div>
          <div className="text-center">
            <span className="font-sans text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--gold)" }}>
              ◆ Signature Dish
            </span>
            <h3 className="mt-1 font-serif text-[22px] font-semibold" style={{ color: "var(--burgundy)" }}>
              {signature.name}
            </h3>
            <p className="mx-auto mt-1 max-w-md font-sans text-[13px] italic leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              {signature.description}
            </p>
            <p className="mt-2 font-serif text-[16px] tabular-nums" style={{ color: "var(--ink-mute)" }}>
              ${signature.price}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <DishRow key={item.id} item={item} dimmed={isDimmed(item)} />
        ))}
      </div>
    </MenuPage>
  );
}
