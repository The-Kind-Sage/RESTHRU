const LABELS = ["Cover", "Appetizers", "Mains", "Desserts", "Cellar", "Contact"];

export function PageNav({
  current,
  total,
  onGo,
}: {
  current: number;
  total: number;
  onGo: (i: number) => void;
}) {
  return (
    <>
      {/* Desktop side rail */}
      <nav
        aria-label="Menu pages"
        className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 lg:flex"
      >
        <ul className="flex flex-col items-center gap-4 px-4">
          {Array.from({ length: total }).map((_, i) => {
            const active = i === current;
            return (
              <li key={i}>
                <button
                  onClick={() => onGo(i)}
                  aria-label={`Go to page ${i + 1} — ${LABELS[i]}`}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-center gap-3"
                >
                  <span
                    className="font-serif text-[13px] tabular-nums transition-colors"
                    style={{
                      color: active ? "var(--gold)" : "var(--ink-soft)",
                      opacity: active ? 1 : 0.55,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="h-px transition-all"
                    style={{
                      width: active ? 28 : 12,
                      backgroundColor: active ? "var(--gold)" : "var(--ink-soft)",
                      opacity: active ? 1 : 0.4,
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile bottom dots */}
      <nav
        aria-label="Menu pages"
        className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 lg:hidden"
      >
        <ul
          className="flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm"
          style={{ borderColor: "var(--rule)", backgroundColor: "var(--paper)" }}
        >
          {Array.from({ length: total }).map((_, i) => {
            const active = i === current;
            return (
              <li key={i}>
                <button
                  onClick={() => onGo(i)}
                  aria-label={`Page ${i + 1}`}
                  aria-current={active ? "page" : undefined}
                  className="block rounded-full transition-all"
                  style={{
                    width: active ? 22 : 6,
                    height: 6,
                    backgroundColor: active ? "var(--burgundy)" : "var(--ink-soft)",
                    opacity: active ? 1 : 0.35,
                  }}
                />
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
