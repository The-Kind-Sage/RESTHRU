import type { ReactNode } from "react";
import { CornerOrnament } from "./CornerOrnament";

export function MenuPage({
  children,
  pageNumber,
  tint = false,
}: {
  children: ReactNode;
  pageNumber?: number;
  tint?: boolean;
}) {
  return (
    <div
      className="paper-texture relative flex h-full w-full flex-col overflow-hidden px-6 py-10 sm:px-10 sm:py-14 lg:px-14"
      style={{
        backgroundColor: tint ? "var(--paper-warm)" : "var(--paper)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <CornerOrnament corner="tl" />
      <CornerOrnament corner="tr" />
      <CornerOrnament corner="bl" />
      <CornerOrnament corner="br" />

      <div className="flex-1 overflow-y-auto">{children}</div>

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
