export function SectionHeader({ title }: { title: string; kicker?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="h-px flex-1" style={{ backgroundColor: "var(--gold)", opacity: 0.3 }} />
      <h2
        className="shrink-0 font-serif text-[20px] font-semibold uppercase leading-none tracking-[0.14em] sm:text-[22px]"
        style={{ color: "var(--burgundy)" }}
      >
        {title}
      </h2>
      <span className="h-px flex-1" style={{ backgroundColor: "var(--gold)", opacity: 0.3 }} />
    </div>
  );
}
