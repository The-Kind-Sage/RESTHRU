// Compact top-left header: title and kicker sit flush at the top of the page
// with the gold rule running out to the right, instead of the old full-width
// centered banner (~130px tall) that pushed dishes down and left room for only
// ~5 rows before the page scrolled. Target: 7+ dish rows visible per page.
export function SectionHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <div className="mb-3 flex items-end gap-3">
      <div className="min-w-0 shrink-0">
        {kicker && (
          <p
            className="mb-0.5 font-sans text-[9px] uppercase tracking-[0.3em]"
            style={{ color: "var(--ink-mute)" }}
          >
            {kicker}
          </p>
        )}
        <h2
          className="font-serif text-[20px] font-semibold uppercase leading-none sm:text-[22px]"
          style={{ color: "var(--burgundy)", letterSpacing: "0.14em" }}
        >
          {title}
        </h2>
      </div>
      <div className="mb-1 flex min-w-0 flex-1 items-center gap-2">
        <span className="h-px flex-1" style={{ backgroundColor: "var(--gold)", opacity: 0.6 }} />
        <span className="text-[10px]" style={{ color: "var(--gold)" }}>
          ◆
        </span>
      </div>
    </div>
  );
}
