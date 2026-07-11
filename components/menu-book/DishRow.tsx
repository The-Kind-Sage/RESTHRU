import type { MenuItemData } from "./types";
import { FoodImage } from "./FoodImage";
import { PriceLeader } from "./PriceLeader";
import { formatPrice } from "./format";
import { Flame, Leaf, WheatOff, Award, Star } from "lucide-react";

const TAG_META: Record<string, { label: string; icon: typeof Flame }> = {
  vegan: { label: "Vegan", icon: Leaf },
  spicy: { label: "Spicy", icon: Flame },
  "gluten-free": { label: "GF", icon: WheatOff },
  signature: { label: "Signature", icon: Star },
  "chefs-pick": { label: "Chef's Pick", icon: Award },
};

export function DishRow({
  item,
  dimmed = false,
  imageSize = "small",
}: {
  item: MenuItemData;
  dimmed?: boolean;
  imageSize?: "small" | "medium" | "large";
}) {
  const isFeatured = item.featured;
  return (
    <div
      className="group relative flex items-start gap-4 rounded-lg p-3 transition-all duration-300 ease-out hover:-translate-y-0.5 sm:gap-5 sm:p-4"
      style={{
        opacity: dimmed ? 0.32 : 1,
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(197,165,90,0.07)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <FoodImage src={item.imageUrl} variant="circle" size={isFeatured ? "large" : imageSize} />

      <div className="min-w-0 flex-1 pt-1">
        {isFeatured && item.tags?.includes("chefs-pick") && (
          <span
            className="mb-1 inline-block font-sans text-[9px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--gold)" }}
          >
            ◆ Chef's Pick
          </span>
        )}
        <div className="flex items-baseline gap-1">
          <h3 className="min-w-0 font-serif text-[16px] font-semibold leading-snug sm:text-[18px]" style={{ color: "var(--ink)" }}>
            {item.name}
          </h3>
          <PriceLeader />
          <span
            className="shrink-0 whitespace-nowrap font-serif text-[15px] font-medium tabular-nums sm:text-[16px]"
            style={{ color: "var(--ink-mute)", fontVariantNumeric: "tabular-nums" }}
          >
            {formatPrice(item.price)}
          </span>
        </div>
        <p className="mt-1 max-w-[52ch] font-sans text-[12.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {item.description}
        </p>
        {item.details && item.details.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.details.map((detail) => (
              <span
                key={detail}
                className="inline-flex rounded-full border px-2 py-0.5 font-sans text-[9px] font-medium uppercase tracking-[0.15em]"
                style={{ borderColor: "rgba(197,165,90,0.35)", color: "var(--ink-mute)" }}
              >
                {detail}
              </span>
            ))}
          </div>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => {
              const meta = TAG_META[tag];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.15em]"
                  style={{ borderColor: "rgba(197,165,90,0.4)", color: "var(--ink-mute)" }}
                >
                  <Icon size={9} />
                  {meta.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
