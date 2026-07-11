import type { ReactNode } from "react";
import { CornerOrnament } from "./CornerOrnament";

export function MenuPage({
  children,
  pageNumber,
  tint = false,
  flow = false,
}: {
  children: ReactNode;
  pageNumber?: number;
  tint?: boolean;
  /**
   * flow=false (desktop book): page fills its slot and scrolls internally.
   * flow=true (mobile vertical layout): page takes its natural height and the
   * document scrolls — no nested scroll areas, no horizontal overflow.
   */
  flow?: boolean;
}) {
  return (
    <div
      className={`paper-texture relative flex w-full flex-col overflow-hidden px-4 py-6 sm:px-7 sm:py-7 lg:px-10 lg:py-8 ${
        flow ? "rounded-2xl" : "h-full"
      }`}
      style={{
        backgroundColor: tint ? "var(--paper-warm)" : "var(--paper)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <CornerOrnament corner="tl" />
      <CornerOrnament corner="tr" />
      <CornerOrnament corner="bl" />
      <CornerOrnament corner="br" />

      <div className={flow ? "" : "flex-1 overflow-y-auto"}>{children}</div>

      {pageNumber !== undefined && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="h-px w-8" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
          <span className="font-serif text-xs italic" style={{ color: "var(--ink-mute)" }}>
            {String(pageNumber).padStart(2, "0")}
          </span>
          <span className="h-px w-8" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
        </div>
      )}
    </div>
  );
}
