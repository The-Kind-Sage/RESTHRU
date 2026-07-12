"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun, SlidersHorizontal, ChevronDown, ArrowUp } from "lucide-react";
import type { MenuData, SectionData } from "./types";
import { CategoryPage } from "./CategoryPage";
import { DrinksPage } from "./DrinksPage";
import { BackCoverPage } from "./BackCoverPage";

// Mobile-only experience: a single vertical scroll. Each menu section is one
// one-sided "page" card (no book spread, no spine line, no horizontal gesture).
// A sticky bar carries the restaurant name, theme + filter controls, and a
// scroll-spy chip rail that tracks the section currently in view.
export function MobileMenu({
  data,
  sections,
  hasDrinks,
  filter,
  dark,
  onToggleDark,
  onOpenFilter,
}: {
  data: MenuData;
  sections: SectionData[];
  hasDrinks: boolean;
  filter: string;
  dark: boolean;
  onToggleDark: () => void;
  onOpenFilter: () => void;
}) {
  // Ordered list of scroll anchors: sections, then beverages, then info.
  const anchors = useMemo(
    () => [
      ...sections.map((s) => ({ id: s.id, label: s.title })),
      ...(hasDrinks ? [{ id: "beverages", label: "Beverages" }] : []),
      { id: "info", label: "Info" },
    ],
    [sections, hasDrinks]
  );

  const [active, setActive] = useState<string>(anchors[0]?.id ?? "");
  const [showTop, setShowTop] = useState(false);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scrollBehavior = (): ScrollBehavior => (prefersReduced() ? "auto" : "smooth");

  // Scroll-spy: mark a section active when its middle band crosses the viewport.
  useEffect(() => {
    const ids = anchors.map((a) => a.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [anchors]);

  // Keep the active chip centred in the rail as you scroll.
  useEffect(() => {
    const chip = chipRefs.current[active];
    if (chip) {
      chip.scrollIntoView({ behavior: scrollBehavior(), inline: "center", block: "nearest" });
    }
  }, [active]);

  // Back-to-top button once you've scrolled past the hero.
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  };

  const firstId = anchors[0]?.id;

  return (
    <div className="relative">
      {/* Sticky nav */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: "var(--paper)",
          borderColor: "var(--rule)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <p
            className="min-w-0 truncate font-serif text-[17px] italic"
            style={{ color: "var(--burgundy)" }}
          >
            {data.restaurant.name}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={onToggleDark}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full border"
              style={{ borderColor: "var(--rule)", color: "var(--ink-soft)" }}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={onOpenFilter}
              aria-label="Filter menu"
              className="flex h-9 items-center gap-1.5 rounded-full border px-3"
              style={{
                borderColor: filter === "all" ? "var(--rule)" : "var(--burgundy)",
                color: filter === "all" ? "var(--ink-soft)" : "var(--burgundy)",
              }}
            >
              <SlidersHorizontal size={13} />
              <span className="font-sans text-[10px] font-medium uppercase tracking-[0.15em]">
                {filter === "all" ? "Filter" : filter.replace("-", " ")}
              </span>
            </button>
          </div>
        </div>

        {/* Scroll-spy chip rail */}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-4 pb-3 pt-3">
          {anchors.map((a) => {
            const isActive = a.id === active;
            return (
              <button
                key={a.id}
                ref={(el) => {
                  chipRefs.current[a.id] = el;
                }}
                onClick={() => goTo(a.id)}
                className="shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.12em] transition-colors"
                style={{
                  borderColor: isActive ? "var(--burgundy)" : "var(--rule)",
                  backgroundColor: isActive ? "var(--burgundy)" : "transparent",
                  color: isActive ? "var(--paper)" : "var(--ink-soft)",
                }}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero */}
      <section className="flex min-h-[calc(100svh-104px)] flex-col items-center justify-center px-6 text-center">
        <p
          className="font-sans text-[10px] uppercase tracking-[0.5em]"
          style={{ color: "var(--gold)" }}
        >
          {data.restaurant.established}
        </p>
        <div className="my-7 flex items-center gap-3">
          <span className="h-px w-14" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
          <span className="text-xs" style={{ color: "var(--gold)" }}>◆</span>
          <span className="h-px w-14" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
        </div>
        <h1
          className="font-serif italic leading-tight text-[42px] sm:text-[56px]"
          style={{ color: "var(--burgundy)", letterSpacing: "-0.01em" }}
        >
          {data.restaurant.name}
        </h1>
        <p
          className="mx-auto mt-5 max-w-sm font-serif text-[15px] italic leading-relaxed"
          style={{ color: "var(--ink-soft)" }}
        >
          {data.restaurant.tagline}
        </p>
        {firstId && (
          <button
            onClick={() => goTo(firstId)}
            className="mt-10 inline-flex items-center gap-2 border px-6 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.25em] transition-colors"
            style={{ borderColor: "var(--burgundy)", color: "var(--burgundy)" }}
          >
            View Menu
          </button>
        )}
        <ChevronDown
          size={22}
          className="mt-12 animate-bounce"
          style={{ color: "var(--gold)" }}
        />
      </section>

      {/* Sections — each a one-sided page card */}
      <div className="space-y-6 px-3 pb-24 pt-4 sm:px-6">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-32">
            <CategoryPage
              title={s.title}
              kicker={s.kicker}
              items={s.items}
              pageNumber={i + 2}
              activeFilter={filter}
              tint={s.tint}
              flow
            />
          </section>
        ))}

        {hasDrinks && (
          <section id="beverages" className="scroll-mt-32">
            <DrinksPage drinks={data.drinks} pageNumber={sections.length + 2} flow />
          </section>
        )}

        <section id="info" className="scroll-mt-32">
          <BackCoverPage
            restaurant={data.restaurant}
            pageNumber={sections.length + (hasDrinks ? 1 : 0) + 2}
            flow
          />
        </section>
      </div>

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
          aria-label="Back to top"
          className="fixed bottom-5 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper)",
            color: "var(--ink-soft)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
          }}
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}
