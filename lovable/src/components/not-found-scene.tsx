import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

function PizzaSlice() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="crust" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.78 0.13 70)" />
          <stop offset="1" stopColor="oklch(0.55 0.14 55)" />
        </linearGradient>
        <linearGradient id="cheese" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.9 0.16 90)" />
          <stop offset="1" stopColor="oklch(0.78 0.19 70)" />
        </linearGradient>
      </defs>
      <path d="M50 8 L92 90 Q50 100 8 90 Z" fill="url(#crust)" />
      <path d="M50 18 L84 84 Q50 92 16 84 Z" fill="url(#cheese)" />
      <circle cx="42" cy="52" r="6" fill="oklch(0.55 0.2 25)" />
      <circle cx="62" cy="58" r="5" fill="oklch(0.55 0.2 25)" />
      <circle cx="50" cy="74" r="6" fill="oklch(0.55 0.2 25)" />
      <circle cx="36" cy="72" r="3" fill="oklch(0.7 0.18 145)" />
      <circle cx="66" cy="76" r="3" fill="oklch(0.7 0.18 145)" />
    </svg>
  );
}

function RamenBowl() {
  return (
    <svg viewBox="0 0 120 110" className="h-full w-full" aria-hidden>
      <g className="steam-group">
        <path d="M40 18 Q46 8 40 -2" stroke="oklch(0.95 0.02 240 / 0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M60 14 Q66 4 60 -6" stroke="oklch(0.95 0.02 240 / 0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M80 18 Q86 8 80 -2" stroke="oklch(0.95 0.02 240 / 0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <path d="M10 45 Q60 40 110 45 L100 95 Q60 108 20 95 Z" fill="oklch(0.35 0.15 25)" />
      <ellipse cx="60" cy="46" rx="50" ry="8" fill="oklch(0.85 0.12 80)" />
      <path d="M25 44 Q40 38 55 44 T85 44 T110 44" stroke="oklch(0.95 0.08 90)" strokeWidth="2" fill="none" />
      <path d="M30 46 Q45 40 60 46 T90 46" stroke="oklch(0.95 0.08 90)" strokeWidth="2" fill="none" />
      <circle cx="40" cy="44" r="4" fill="oklch(0.9 0.12 90)" stroke="oklch(0.5 0.05 90)" strokeWidth="1" />
      <circle cx="75" cy="43" r="4" fill="oklch(0.9 0.12 90)" stroke="oklch(0.5 0.05 90)" strokeWidth="1" />
      <rect x="52" y="44" width="16" height="5" fill="oklch(0.65 0.15 25)" rx="1" />
      <path d="M18 62 Q60 68 102 62" stroke="oklch(0.25 0.1 25)" strokeWidth="1" fill="none" />
    </svg>
  );
}

function SoftServe() {
  return (
    <svg viewBox="0 0 80 130" className="h-full w-full" aria-hidden>
      <path d="M20 70 L40 125 L60 70 Z" fill="oklch(0.68 0.12 60)" />
      <path d="M24 78 L56 78 M28 88 L52 88 M32 98 L48 98" stroke="oklch(0.45 0.1 55)" strokeWidth="1" />
      <ellipse cx="40" cy="70" rx="22" ry="7" fill="oklch(0.96 0.02 90)" />
      <path d="M18 68 Q40 40 62 68 Q58 58 40 55 Q22 58 18 68 Z" fill="oklch(0.97 0.03 90)" />
      <path d="M22 60 Q40 32 58 60 Q54 50 40 48 Q26 50 22 60 Z" fill="oklch(0.98 0.02 90)" />
      <path d="M26 50 Q40 22 54 50 Q50 42 40 40 Q30 42 26 50 Z" fill="oklch(0.99 0.01 90)" />
      <circle cx="40" cy="22" r="6" fill="oklch(0.6 0.22 20)" />
      <path d="M40 16 Q42 8 46 6" stroke="oklch(0.45 0.15 145)" strokeWidth="2" fill="none" />
    </svg>
  );
}

function Chopsticks() {
  return (
    <svg viewBox="0 0 100 20" className="h-full w-full" aria-hidden>
      <rect x="0" y="4" width="100" height="3" fill="oklch(0.55 0.08 60)" rx="1" />
      <rect x="0" y="12" width="100" height="3" fill="oklch(0.55 0.08 60)" rx="1" />
    </svg>
  );
}

function Cherry() {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full" aria-hidden>
      <path d="M30 8 Q40 20 45 30" stroke="oklch(0.5 0.15 145)" strokeWidth="2" fill="none" />
      <circle cx="30" cy="42" r="12" fill="oklch(0.55 0.22 20)" />
      <circle cx="26" cy="38" r="3" fill="oklch(0.75 0.15 20)" />
    </svg>
  );
}

type Item = { Comp: () => ReactNode; size: string; extra: string };

const items: Item[] = [
  { Comp: PizzaSlice, size: "h-24 w-24 md:h-32 md:w-32", extra: "anim-spin-slow" },
  { Comp: RamenBowl, size: "h-24 w-28 md:h-32 md:w-36", extra: "anim-bob" },
  { Comp: SoftServe, size: "h-32 w-20 md:h-40 md:w-24", extra: "anim-float-tilt" },
  { Comp: Cherry, size: "h-14 w-14 md:h-16 md:w-16", extra: "anim-bob-fast" },
  { Comp: Chopsticks, size: "h-6 w-24 md:h-8 md:w-28", extra: "anim-float-tilt" },
];

export function NotFoundScene() {
  const track = [...items, ...items, ...items, ...items];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.08_285)_0%,_oklch(0.14_0.04_265)_55%,_oklch(0.08_0.02_265)_100%)] text-foreground">
      <style>{`
        @keyframes drift {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-50%,0,0); }
        }
        @keyframes bob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-10px); }
        }
        @keyframes bobFast {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes floatTilt {
          0%,100% { transform: translateY(0) rotate(-4deg); }
          50%     { transform: translateY(-12px) rotate(4deg); }
        }
        @keyframes steam {
          0%   { transform: translateY(6px); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateY(-18px); opacity: 0; }
        }
        @keyframes dust {
          0%   { transform: translate3d(0,0,0); opacity: 0; }
          10%  { opacity: .8; }
          100% { transform: translate3d(var(--dx,20px),-120vh,0); opacity: 0; }
        }
        @keyframes glowPulse {
          0%,100% { opacity: .55; transform: scale(1); }
          50%     { opacity: .85; transform: scale(1.06); }
        }
        .drift-track { animation: drift 32s linear infinite; width: max-content; }
        .anim-spin-slow    { animation: spinSlow 14s linear infinite; transform-origin: 50% 50%; }
        .anim-bob          { animation: bob 3.2s ease-in-out infinite; }
        .anim-bob-fast     { animation: bobFast 2.1s ease-in-out infinite; }
        .anim-float-tilt   { animation: floatTilt 4.5s ease-in-out infinite; }
        .steam-group path  { animation: steam 2.4s ease-in-out infinite; transform-origin: bottom; }
        .steam-group path:nth-child(2) { animation-delay: .6s; }
        .steam-group path:nth-child(3) { animation-delay: 1.2s; }
        .dust { animation: dust linear infinite; }
        .glow-pulse { animation: glowPulse 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .drift-track, .anim-spin-slow, .anim-bob, .anim-bob-fast,
          .anim-float-tilt, .steam-group path, .dust, .glow-pulse {
            animation: none !important;
          }
        }
      `}</style>

      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-[oklch(0.7_0.2_25/.25)] blur-3xl glow-pulse" />
      <div className="pointer-events-none absolute -right-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.75_0.18_320/.22)] blur-3xl glow-pulse" style={{ animationDelay: "2s" }} />
      <div className="pointer-events-none absolute left-1/2 bottom-0 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-[oklch(0.8_0.18_80/.18)] blur-3xl glow-pulse" style={{ animationDelay: "4s" }} />

      {/* Dotted grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.95 0.02 240) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Flour dust */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 22 }).map((_, i) => {
          const left = (i * 53) % 100;
          const dur = 12 + ((i * 7) % 14);
          const delay = (i * 1.3) % 10;
          const size = 2 + (i % 3);
          const dx = ((i % 5) - 2) * 20;
          return (
            <span
              key={i}
              className="dust absolute rounded-full bg-[oklch(0.95_0.02_240/.7)]"
              style={{
                left: `${left}%`,
                bottom: `-10px`,
                width: size,
                height: size,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                // @ts-expect-error css var
                "--dx": `${dx}px`,
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        {/* Top bar */}
        <header className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[oklch(0.75_0.2_25)]" />
            <span className="tracking-[0.2em] uppercase text-xs">Kitchen Void · Error 404</span>
          </div>
          <Link to="/" className="hover:text-foreground transition-colors">← Back</Link>
        </header>

        {/* Headline */}
        <div className="mt-14 md:mt-20 text-center">
          <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-[oklch(0.8_0.15_80)]">
            Order status
          </p>
          <h1 className="mt-4 font-serif text-5xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] text-foreground">
            This dish isn't
            <br />
            <span className="italic text-[oklch(0.85_0.15_80)]">on the menu.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-muted-foreground">
            Looks like that recipe failed. The page you're craving has drifted
            off into the kitchen void — but the pass is still hot.
          </p>
        </div>

        {/* Animation belt */}
        <div className="relative mt-14 md:mt-20">
          {/* fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[oklch(0.14_0.04_265)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[oklch(0.14_0.04_265)] to-transparent" />

          <div className="relative overflow-hidden py-6">
            <div className="drift-track flex items-end gap-16 md:gap-24">
              {track.map(({ Comp, size, extra }, i) => (
                <div key={i} className={`shrink-0 ${size}`}>
                  <div className={`h-full w-full ${extra}`}>
                    <Comp />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Belt shadow line */}
          <div className="mx-auto mt-2 h-px w-11/12 bg-gradient-to-r from-transparent via-[oklch(0.95_0.02_240/.25)] to-transparent" />
        </div>

        {/* CTA */}
        <div className="mt-14 md:mt-20 flex flex-col items-center gap-4">
          <Link
            to="/"
            className="group relative inline-flex items-center gap-3 rounded-full bg-[oklch(0.85_0.15_80)] px-8 py-4 text-sm md:text-base font-medium text-[oklch(0.2_0.05_60)] shadow-[0_10px_40px_-8px_oklch(0.85_0.15_80/.55)] transition-transform hover:scale-[1.03]"
          >
            Return to Home Page
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <span className="text-xs text-muted-foreground">
            Or wander the menu below
          </span>
        </div>

        <div className="flex-1" />

        {/* Footer */}
        <footer className="mt-16 border-t border-[oklch(0.95_0.02_240/.12)] pt-6 pb-2">
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="opacity-30">·</span>
            <a href="#menu" className="hover:text-foreground transition-colors">Menu</a>
            <span className="opacity-30">·</span>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <span className="opacity-30">·</span>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <p className="mt-4 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/60">
            Served fresh from the kitchen void
          </p>
        </footer>
      </div>
    </div>
  );
}