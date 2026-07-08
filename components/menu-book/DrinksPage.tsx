import type { DrinkItemData } from "./types";
import { MenuPage } from "./MenuPage";
import { SectionHeader } from "./SectionHeader";
import { PriceLeader } from "./PriceLeader";
import { FoodImage } from "./FoodImage";

export function DrinksPage({ drinks }: { drinks: DrinkItemData[] }) {
  const wines = drinks.filter((d) => d.group === "wine");
  const cocktails = drinks.filter((d) => d.group === "cocktail");

  return (
    <MenuPage pageNumber={5}>
      <SectionHeader title="Beverages" kicker="Wine · Cocktails" />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <div>
          <h3 className="mb-4 text-center font-serif italic text-[18px]" style={{ color: "var(--burgundy)" }}>
            Wine List
          </h3>
          <ul className="space-y-2.5">
            {wines.map((w) => (
              <li key={w.id} className="flex items-baseline gap-2">
                <div className="flex items-center gap-3">
                  <FoodImage src={w.imageUrl} variant="circle" size="small" />
                  <span className="font-serif text-[14px]" style={{ color: "var(--ink)" }}>{w.name}</span>
                </div>
                <PriceLeader />
                <span className="font-serif text-[14px] tabular-nums" style={{ color: "var(--ink-mute)" }}>
                  ${w.price}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-center font-serif italic text-[18px]" style={{ color: "var(--burgundy)" }}>
            Cocktails
          </h3>
          <ul className="space-y-4">
            {cocktails.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline gap-2">
                  <div className="flex items-center gap-3">
                    <FoodImage src={c.imageUrl} variant="circle" size="small" />
                    <span className="font-serif text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                      {c.name}
                    </span>
                  </div>
                  <PriceLeader />
                  <span className="font-serif text-[14px] tabular-nums" style={{ color: "var(--ink-mute)" }}>
                    ${c.price}
                  </span>
                </div>
                {c.description && (
                  <p className="mt-0.5 font-sans text-[11.5px] italic leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    {c.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MenuPage>
  );
}
