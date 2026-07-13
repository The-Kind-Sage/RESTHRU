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
        <div className="my-6 flex items-center gap-3">
          <span className="h-px w-16" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
          <span className="text-xs" style={{ color: "var(--gold)" }}>◆</span>
          <span className="h-px w-16" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
        </div>
        <p className="font-serif text-[13px] italic leading-relaxed sm:text-[15px]" style={{ color: "var(--ink-soft)" }}>
          Welcome
        </p>
        <p className="font-serif text-[13px] italic leading-relaxed sm:text-[15px]" style={{ color: "var(--ink-soft)" }}>
          To
        </p>
        <h1
          className="mt-2 font-serif italic text-[44px] leading-tight sm:text-[64px]"
          style={{ color: "var(--burgundy)", letterSpacing: "-0.01em" }}
        >
          {restaurant.name}
        </h1>

        <div className="my-10 flex flex-col items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--ink)" }}>
            Click to explore
          </span>
          <span className="inline-block h-3 w-3 animate-bounce" style={{ color: "var(--gold)", opacity: 0.8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5"/><path d="M7 6l5 5 5-5"/></svg>
          </span>
        </div>

        <button
          onClick={onBegin}
          className="group inline-flex items-center gap-2 border px-8 py-3.5 font-sans text-[11px] font-medium uppercase tracking-[0.25em] transition-all duration-300 hover:text-paper"
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
          Open Menu
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </MenuPage>
  );
}
