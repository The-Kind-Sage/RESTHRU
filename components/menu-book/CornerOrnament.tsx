type Corner = "tl" | "tr" | "bl" | "br";

export function CornerOrnament({ corner }: { corner: Corner }) {
  const rotation = {
    tl: "rotate(0deg)",
    tr: "rotate(90deg)",
    br: "rotate(180deg)",
    bl: "rotate(270deg)",
  }[corner];

  const position = {
    tl: "top-3 left-3",
    tr: "top-3 right-3",
    bl: "bottom-3 left-3",
    br: "bottom-3 right-3",
  }[corner];

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute ${position} h-14 w-14 text-gold`}
      // position must ALSO be inline: globals.css has `.paper-texture > * {
      // position: relative }` (to lift content above the noise overlay), which
      // ties with `.absolute` on specificity and wins on source order — the
      // four ornaments then stack in normal flow as ~224px of blank spacers
      // pushing every section heading toward the middle of the page.
      style={{ transform: rotation, opacity: 0.55, position: "absolute" }}
      viewBox="0 0 60 60"
      fill="none"
      stroke="currentColor"
    >
      <path d="M4 4 L28 4" strokeWidth="1" />
      <path d="M4 4 L4 28" strokeWidth="1" />
      <path d="M4 4 L18 18" strokeWidth="0.6" />
      <path d="M10 4 Q16 10 10 16" strokeWidth="0.6" />
      <path d="M4 10 Q10 16 16 10" strokeWidth="0.6" />
      <circle cx="4" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20" cy="20" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="28" cy="4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="4" cy="28" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
