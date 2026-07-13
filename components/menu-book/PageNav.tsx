// Desktop-only side rail. (The old mobile bottom dots are gone — on mobile the
// menu is now a vertical scroll with a sticky category nav instead of pages.)
export function PageNav({
  current,
  labels,
  onGo,
}: {
  current: number;
  labels: string[];
  onGo: (i: number) => void;
}) {
  return (
    <nav
      aria-label="Menu pages"
      className="fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 lg:flex pointer-events-none"
    >
      <ul className="flex flex-col items-center gap-4 px-4">
        {labels.map((label, i) => {
          const active = i === current;
          return (
            <li key={`${label}-${i}`}>
              <button
                onClick={() => onGo(i)}
                aria-label={`Go to page ${i + 1} — ${label}`}
                aria-current={active ? "page" : undefined}
                className="group flex items-center gap-3 pointer-events-auto"
                title={label}
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
  );
}
