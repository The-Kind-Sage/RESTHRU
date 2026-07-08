"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Moon, Sun, ChevronLeft, ChevronRight } from "lucide-react";
import type { MenuData } from "./types";
import { CoverPage } from "./CoverPage";
import { CategoryPage } from "./CategoryPage";
import { DrinksPage } from "./DrinksPage";
import { BackCoverPage } from "./BackCoverPage";
import { PageNav } from "./PageNav";
import { FilterPanel } from "./FilterPanel";

const TOTAL_PAGES = 6;

export function MenuBook({ data }: { data: MenuData }) {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const go = useCallback((to: number) => {
    setDir(to > page ? 1 : -1);
    setPage(Math.max(0, Math.min(TOTAL_PAGES - 1, to)));
  }, [page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(page + 1);
      else if (e.key === "ArrowLeft") go(page - 1);
      else if (/^[1-6]$/.test(e.key)) go(parseInt(e.key, 10) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  const appetizers = data.categories.find(
    (c) => c.slug === "appetizers" || c.name.toLowerCase().includes("appetizer")
  );
  const mains = data.categories.find(
    (c) => c.slug === "mains" || c.name.toLowerCase().includes("main")
  );
  const desserts = data.categories.find(
    (c) => c.slug === "desserts" || c.name.toLowerCase().includes("dessert")
  );

  const appetizerItems = appetizers?.items ?? [];
  const mainItems = mains?.items ?? [];
  const dessertItems = desserts?.items ?? [];
  const mainSig = mainItems.find((m) => m.tags?.includes("signature"));

  const renderPage = (i: number) => {
    switch (i) {
      case 0:
        return <CoverPage restaurant={data.restaurant} onBegin={() => go(1)} />;
      case 1:
        return (
          <CategoryPage
            title="Appetizers"
            kicker="Pour Commencer"
            items={appetizerItems}
            pageNumber={2}
            activeFilter={filter}
          />
        );
      case 2:
        return (
          <CategoryPage
            title="Main Courses"
            kicker="Les Plats"
            items={mainItems.filter((m) => m.id !== mainSig?.id)}
            pageNumber={3}
            activeFilter={filter}
            signature={mainSig}
          />
        );
      case 3:
        return (
          <CategoryPage
            title="Desserts"
            kicker="Pour Finir"
            items={dessertItems}
            pageNumber={4}
            activeFilter={filter}
            tint
          />
        );
      case 4:
        return <DrinksPage drinks={data.drinks} />;
      case 5:
        return <BackCoverPage restaurant={data.restaurant} />;
      default:
        return null;
    }
  };

  const isCover = page === 0 || page === TOTAL_PAGES - 1;

  return (
    <div
      className="paper-texture relative min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: dark ? "#0f0c0a" : "#efe8db" }}
    >
      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 sm:p-6">
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
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--burgundy)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 rounded-full border px-3 py-2 font-sans text-[10px] font-medium uppercase tracking-[0.2em] transition-colors"
            style={{ borderColor: "var(--rule)", color: "var(--ink-soft)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--burgundy)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}
          >
            <Filter size={12} />
            <span className="hidden sm:inline">
              {filter === "all" ? "Filter" : filter.replace("-", " ")}
            </span>
          </button>
        </div>
      </header>

      <PageNav current={page} total={TOTAL_PAGES} onGo={go} />

      {/* Book stage */}
      <div className="flex items-center justify-center px-2 py-6 sm:py-10 lg:px-8" style={{ height: "100dvh" }}>
        <div
          className={`book-spine relative w-full ${
            isCover ? "max-w-[640px]" : "max-w-[640px] lg:max-w-[1280px]"
          }`}
          style={{ height: "min(90dvh, 960px)" }}
        >
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={page}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40, rotateY: dir * 4 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: dir * -40, rotateY: dir * -4 }}
              transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                const threshold = 40;
                const velocity = info.velocity.x;
                if (info.offset.x < -threshold || velocity < -300) go(page + 1);
                else if (info.offset.x > threshold || velocity > 300) go(page - 1);
              }}
              className="grid h-full w-full grid-cols-1 gap-0 lg:grid-cols-2 cursor-grab active:cursor-grabbing"
              style={{ perspective: "1600px" }}
            >
              {isCover ? (
                <div className="col-span-full h-full">{renderPage(page)}</div>
              ) : (
                <>
                  <div className="h-full">{renderPage(page)}</div>
                  <div className="hidden h-full lg:block">
                    {renderPage(Math.min(page + 1, TOTAL_PAGES - 1)) ??
                      renderPage(page)}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Arrow controls (desktop) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-4 lg:flex">
        <button
          onClick={() => go(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border transition-all disabled:opacity-30"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper)",
            color: "var(--ink-soft)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--burgundy)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => go(page + (isCover ? 1 : 2))}
          disabled={page >= TOTAL_PAGES - 1}
          aria-label="Next page"
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border transition-all disabled:opacity-30"
          style={{
            borderColor: "var(--rule)",
            backgroundColor: "var(--paper)",
            color: "var(--ink-soft)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--burgundy)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        active={filter}
        setActive={setFilter}
      />
    </div>
  );
}
