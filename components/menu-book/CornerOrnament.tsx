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
      style={{ transform: rotation, opacity: 0.55 }}
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
