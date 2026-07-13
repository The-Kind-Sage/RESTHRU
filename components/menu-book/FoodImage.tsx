import { Camera } from "lucide-react";

type Variant = "circle" | "rectangle" | "featured";
type Size = "small" | "medium" | "large" | "hero";

const sizes: Record<Size, string> = {
  small: "h-14 w-14 sm:h-16 sm:w-16",
  medium: "h-16 w-16 sm:h-20 sm:w-20",
  large: "h-28 w-28 sm:h-32 sm:w-32",
  hero: "h-full w-full aspect-[16/9]",
};

export function FoodImage({
  src,
  variant = "circle",
  size = "small",
  label = "Your Photo",
  className = "",
}: {
  src?: string | null;
  variant?: Variant;
  size?: Size;
  label?: string;
  className?: string;
}) {
  const isCircle = variant === "circle";
  const rounded = isCircle ? "rounded-full" : "rounded-lg";
  const dimension = variant === "featured" ? "h-full w-full aspect-[16/9]" : sizes[size];

  if (src) {
    return (
      <div
        className={`relative flex shrink-0 overflow-hidden ${rounded} ${dimension} ${className}`}
        style={{
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        }}
      >
        <img
          src={src}
          alt={label}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`group/img book-shimmer relative flex shrink-0 flex-col items-center justify-center overflow-hidden border border-dashed transition-all duration-300 ${rounded} ${dimension} ${className}`}
      style={{
        borderColor: "rgba(197, 165, 90, 0.5)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
      }}
    >
      <Camera
        className="text-gold"
        style={{ opacity: 0.35 }}
        size={variant === "featured" || size === "hero" ? 32 : size === "large" ? 22 : 16}
      />
      {(variant === "featured" || size === "large" || size === "hero") && (
        <span
          className="mt-1 font-sans text-[9px] uppercase tracking-[0.18em]"
          style={{ color: "var(--gold)", opacity: 0.4 }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
