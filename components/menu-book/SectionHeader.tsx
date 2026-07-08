export function SectionHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <div className="mb-8 text-center">
      {kicker && (
        <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--ink-mute)" }}>
          {kicker}
        </p>
      )}
      <h2
        className="font-serif text-[26px] font-semibold uppercase sm:text-[30px]"
        style={{ color: "var(--burgundy)", letterSpacing: "0.18em" }}
      >
        {title}
      </h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-12" style={{ backgroundColor: "var(--gold)", opacity: 0.7 }} />
        <span className="text-xs" style={{ color: "var(--gold)" }}>◆</span>
        <span className="h-px w-12" style={{ backgroundColor: "var(--gold)", opacity: 0.7 }} />
      </div>
    </div>
  );
}
