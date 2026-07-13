import type { DrinkItemData } from "./types";
import { MenuPage } from "./MenuPage";
import { SectionHeader } from "./SectionHeader";
import { PriceLeader } from "./PriceLeader";
import { FoodImage } from "./FoodImage";
import { formatPrice } from "./format";

// One unified beverage list. (The old page split drinks into fake "Wine List"
// and "Cocktails" groups by alternating rows — real data has no such split.)
export function DrinksPage({
  drinks,
  pageNumber,
  flow = false,
}: {
  drinks: DrinkItemData[];
  pageNumber?: number;
  flow?: boolean;
}) {
  return (
    <MenuPage pageNumber={pageNumber} flow={flow}>
      <SectionHeader title="Beverages" />

      <ul className="space-y-1">
        {drinks.map((drink) => (
          <li
            key={drink.id}
            className="group flex items-start gap-4 rounded-lg p-3 transition-colors sm:gap-5 sm:p-4"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(197,165,90,0.07)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <FoodImage src={drink.imageUrl} variant="circle" size="small" />
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-baseline gap-1">
                <h3
                  className="min-w-0 font-serif text-[16px] font-semibold leading-snug sm:text-[18px]"
                  style={{ color: "var(--ink)" }}
                >
                  {drink.name}
                </h3>
                <PriceLeader />
                <span
                  className="shrink-0 whitespace-nowrap font-serif text-[15px] font-medium tabular-nums sm:text-[16px]"
                  style={{ color: "var(--ink-mute)" }}
                >
                  {formatPrice(drink.price)}
                </span>
              </div>
              {drink.description && (
                <p
                  className="mt-1 max-w-[52ch] font-sans text-[12.5px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {drink.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </MenuPage>
  );
}
