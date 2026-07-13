"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun, ChevronLeft, ChevronRight } from "lucide-react";
import type { MenuData, SectionData } from "./types";
import { CoverPage } from "./CoverPage";
import { CategoryPage } from "./CategoryPage";
import { DrinksPage } from "./DrinksPage";
import { BackCoverPage } from "./BackCoverPage";
import { PageNav } from "./PageNav";
import { MobileMenu } from "./MobileMenu";

// English kickers keyed by the normalized section name. Custom categories that
// don't match simply render without a kicker.
const KICKERS: Record<string, string> = {
  Appetizers: "To Begin",
  "Main Courses": "The Mains",
  Desserts: "To Finish",
  Extra: "Sides & More",
};

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

export function MenuBook({ data }: { data: MenuData }) {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  // Build sections from real data: drop empty categories, keep every non-empty
  // one (including custom categories), alternate tint for rhythm.
  const sections: SectionData[] = useMemo(
    () =>
      data.categories
        .filter((c) => c.items.length > 0)
        .map((c, i) => ({
          id: c.slug || slugify(c.name),
          title: c.name,
          kicker: KICKERS[c.name],
          items: c.items,
          tint: i % 2 === 1,
        })),
    [data.categories]
  );

  const hasDrinks = data.drinks.length > 0;

  // Page map: [cover, ...sections, (drinks?), backcover]
  const TOTAL = 1 + sections.length + (hasDrinks ? 1 : 0) + 1;
  const drinksIndex = hasDrinks ? TOTAL - 2 : -1;
  const lastIndex = TOTAL - 1;

  const go = useCallback(
    (to: number) => {
      setDir(to > page ? 1 : -1);
      setPage(Math.max(0, Math.min(lastIndex, to)));
    },
    [page, lastIndex]
  );

  const next = useCallback(() => go(page === 0 ? 1 : page + 2), [go, page]);
  const prev = useCallback(() => go(page <= 1 ? 0 : page - 2), [go, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (/^[1-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10);
        if (n <= TOTAL) go(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, TOTAL]);

  const renderPage = (i: number) => {
    if (i === 0) return <CoverPage restaurant={data.restaurant} onBegin={() => go(1)} />;
    if (i === lastIndex)
      return <BackCoverPage restaurant={data.restaurant} pageNumber={TOTAL} />;
    if (i === drinksIndex)
      return <DrinksPage drinks={data.drinks} pageNumber={i + 1} />;
    const section = sections[i - 1];
    if (!section) return null;
    return (
      <CategoryPage
        title={section.title}
        kicker={section.kicker}
        items={section.items}
        pageNumber={i + 1}
        activeFilter="all"
        tint={section.tint}
      />
    );
  };

  const isCover = page === 0 || page === lastIndex;
  const prevDisabled = page === 0;
  const nextDisabled = page > 0 && page >= lastIndex - 1;

  const labels = [
    "Cover",
    ...sections.map((s) => s.title),
    ...(hasDrinks ? ["Beverages"] : []),
    "Contact",
  ];

  return (
    <div
      className="paper-texture relative min-h-screen w-full overflow-x-hidden"
      style={{ backgroundColor: dark ? "#0f0c0a" : "#efe8db" }}
    >
      {/* ---------- Mobile (vertical scroll) ---------- */}
      <div className="lg:hidden">
        <MobileMenu
          data={data}
          sections={sections}
          hasDrinks={hasDrinks}
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
        />
      </div>

      {/* ---------- Desktop (book spread) ---------- */}
      <div className="hidden lg:block">
        {/* Top bar */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-5">
          <div className="pointer-events-auto">
            <p
              className="font-sans text-[10px] uppercase tracking-[0.4em]"
              style={{ color: "var(--ink-mute)" }}
            >
              {data.restaurant.name}
            </p>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
              style={{ borderColor: "var(--rule)", color: "var(--ink-soft)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--burgundy)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-soft)")}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

          </div>
        </header>

        <PageNav current={page} labels={labels} onGo={go} />

        {/* Book stage */}
        <div className="flex h-[100dvh] items-center justify-center overflow-hidden px-2">
          <div
            className={`${isCover ? "" : "book-spine"} relative h-full w-full ${
              isCover ? "max-w-[700px]" : "max-w-[1280px]"
            }`}
            style={{ height: "100dvh" }}
          >
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={page}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40, rotateY: dir * 4 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: dir * -40, rotateY: dir * -4 }}
                transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                className="grid h-full w-full grid-cols-2 gap-0"
                style={{ perspective: "1600px" }}
              >
                {isCover ? (
                  <div className="col-span-full h-full">{renderPage(page)}</div>
                ) : (
                  <>
                    <div className="h-full">{renderPage(page)}</div>
                    <div className="h-full">{renderPage(Math.min(page + 1, lastIndex))}</div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Arrow controls */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
          <button
            onClick={prev}
            disabled={prevDisabled}
            aria-label="Previous page"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border transition-all disabled:opacity-30"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper)",
              color: "var(--ink-soft)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--burgundy)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-soft)")}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            disabled={nextDisabled}
            aria-label="Next page"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border transition-all disabled:opacity-30"
            style={{
              borderColor: "var(--rule)",
              backgroundColor: "var(--paper)",
              color: "var(--ink-soft)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--burgundy)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-soft)")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>


    </div>
  );
}
