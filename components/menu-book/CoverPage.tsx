import { ChevronRight } from "lucide-react";
import { MenuPage } from "./MenuPage";

export function CoverPage({
  restaurant,
  onBegin,
}: {
  restaurant: { name: string; tagline: string; established: string };
  onBegin: () => void;
}) {
  return (
    <MenuPage>
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="font-sans text-[10px] uppercase tracking-[0.5em]" style={{ color: "var(--gold)" }}>
          {restaurant.established}
        </p>
        <div className="my-8 flex items-center gap-3">
          <span className="h-px w-16" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
          <span className="text-xs" style={{ color: "var(--gold)" }}>◆</span>
          <span className="h-px w-16" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
        </div>
        <h1
          className="font-serif italic text-[44px] leading-tight sm:text-[64px]"
          style={{ color: "var(--burgundy)", letterSpacing: "-0.01em" }}
        >
          {restaurant.name}
        </h1>
        <p
          className="mx-auto mt-6 max-w-xs font-serif text-[15px] italic leading-relaxed sm:text-base"
          style={{ color: "var(--ink-soft)" }}
        >
          {restaurant.tagline}
        </p>

        <div className="my-10 flex items-center gap-3">
          <span className="h-px w-20" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
          <span className="text-xs" style={{ color: "var(--gold)" }}>✦</span>
          <span className="h-px w-20" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
        </div>

        <button
          onClick={onBegin}
          className="group inline-flex items-center gap-2 border px-6 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.25em] transition-all duration-300 hover:text-paper"
          style={{
            borderColor: "var(--burgundy)",
            color: "var(--burgundy)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--burgundy)";
            e.currentTarget.style.color = "var(--paper)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--burgundy)";
          }}
        >
          Begin Menu
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </MenuPage>
  );
}
