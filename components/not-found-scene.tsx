'use client';

import Link from 'next/link';

function PizzaSlice() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="crust" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#c8934a" />
          <stop offset="1" stopColor="#a0672b" />
        </linearGradient>
        <linearGradient id="cheese" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f5e6b8" />
          <stop offset="1" stopColor="#e8c86a" />
        </linearGradient>
      </defs>
      <path d="M50 8 L92 90 Q50 100 8 90 Z" fill="url(#crust)" />
      <path d="M50 18 L84 84 Q50 92 16 84 Z" fill="url(#cheese)" />
      <circle cx="42" cy="52" r="6" fill="#8b3a3a" />
      <circle cx="62" cy="58" r="5" fill="#8b3a3a" />
      <circle cx="50" cy="74" r="6" fill="#8b3a3a" />
      <circle cx="36" cy="72" r="3" fill="#4a8c5c" />
      <circle cx="66" cy="76" r="3" fill="#4a8c5c" />
    </svg>
  );
}

function RamenBowl() {
  return (
    <svg viewBox="0 0 120 110" className="h-full w-full" aria-hidden>
      <g className="steam-group">
        <path d="M40 18 Q46 8 40 -2" stroke="rgba(255,255,255,0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M60 14 Q66 4 60 -6" stroke="rgba(255,255,255,0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M80 18 Q86 8 80 -2" stroke="rgba(255,255,255,0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <path d="M10 45 Q60 40 110 45 L100 95 Q60 108 20 95 Z" fill="#5c3a1e" />
      <ellipse cx="60" cy="46" rx="50" ry="8" fill="#e8c86a" />
      <path d="M25 44 Q40 38 55 44 T85 44 T110 44" stroke="#f5e6b8" strokeWidth="2" fill="none" />
      <path d="M30 46 Q45 40 60 46 T90 46" stroke="#f5e6b8" strokeWidth="2" fill="none" />
      <circle cx="40" cy="44" r="4" fill="#e8c86a" stroke="#8b7355" strokeWidth="1" />
      <circle cx="75" cy="43" r="4" fill="#e8c86a" stroke="#8b7355" strokeWidth="1" />
      <rect x="52" y="44" width="16" height="5" fill="#8b3a3a" rx="1" />
      <path d="M18 62 Q60 68 102 62" stroke="#3d2212" strokeWidth="1" fill="none" />
    </svg>
  );
}

function SoftServe() {
  return (
    <svg viewBox="0 0 80 130" className="h-full w-full" aria-hidden>
      <path d="M20 70 L40 125 L60 70 Z" fill="#c8934a" />
      <path d="M24 78 L56 78 M28 88 L52 88 M32 98 L48 98" stroke="#8b6b3a" strokeWidth="1" />
      <ellipse cx="40" cy="70" rx="22" ry="7" fill="#faf5eb" />
      <path d="M18 68 Q40 40 62 68 Q58 58 40 55 Q22 58 18 68 Z" fill="#fff8ee" />
      <path d="M22 60 Q40 32 58 60 Q54 50 40 48 Q26 50 22 60 Z" fill="#fffcf5" />
      <path d="M26 50 Q40 22 54 50 Q50 42 40 40 Q30 42 26 50 Z" fill="white" />
      <circle cx="40" cy="22" r="6" fill="#8b3a3a" />
      <path d="M40 16 Q42 8 46 6" stroke="#4a8c5c" strokeWidth="2" fill="none" />
    </svg>
  );
}

function Chopsticks() {
  return (
    <svg viewBox="0 0 100 20" className="h-full w-full" aria-hidden>
      <rect x="0" y="4" width="100" height="3" fill="#c8934a" rx="1" />
      <rect x="0" y="12" width="100" height="3" fill="#c8934a" rx="1" />
    </svg>
  );
}

function Cherry() {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full" aria-hidden>
      <path d="M30 8 Q40 20 45 30" stroke="#4a8c5c" strokeWidth="2" fill="none" />
      <circle cx="30" cy="42" r="12" fill="#8b3a3a" />
      <circle cx="26" cy="38" r="3" fill="#c55a5a" />
    </svg>
  );
}

type Item = { Comp: () => React.ReactNode; size: string; extra: string };

const items: Item[] = [
  { Comp: PizzaSlice, size: "h-16 w-16 sm:h-20 sm:w-20 md:h-32 md:w-32", extra: "anim-spin-slow" },
  { Comp: RamenBowl, size: "h-16 w-[72px] sm:h-20 sm:w-24 md:h-32 md:w-36", extra: "anim-bob" },
  { Comp: SoftServe, size: "h-24 w-14 sm:h-28 sm:w-16 md:h-40 md:w-24", extra: "anim-float-tilt" },
  { Comp: Cherry, size: "h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16", extra: "anim-bob-fast" },
  { Comp: Chopsticks, size: "h-4 w-16 sm:h-5 sm:w-20 md:h-8 md:w-28", extra: "anim-float-tilt" },
];

export function NotFoundScene() {
  const track = [...items, ...items, ...items, ...items];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#141210] text-white">
      <style>{`
        @keyframes drift {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-50%,0,0); }
        }
        @keyframes bob {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        @keyframes bobFast {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-4px); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes floatTilt {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          50%     { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes steam {
          0%   { transform: translateY(4px); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateY(-12px); opacity: 0; }
        }
        @keyframes dust {
          0%   { transform: translate3d(0,0,0); opacity: 0; }
          10%  { opacity: .7; }
          100% { transform: translate3d(var(--dx,20px),-120vh,0); opacity: 0; }
        }
        @keyframes glowPulse {
          0%,100% { opacity: .3; transform: scale(1); }
          50%     { opacity: .6; transform: scale(1.06); }
        }
        .drift-track { animation: drift 40s linear infinite; width: max-content; }
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

      {/* Ambient glows — smaller on mobile */}
      <div className="pointer-events-none absolute -left-16 top-1/4 h-48 w-48 md:h-80 md:w-80 rounded-full bg-accent/20 blur-2xl md:blur-3xl glow-pulse" />
      <div className="pointer-events-none absolute -right-16 top-1/2 h-56 w-56 md:h-[24rem] md:w-[24rem] rounded-full bg-rose-500/15 blur-2xl md:blur-3xl glow-pulse" style={{ animationDelay: "2.5s" }} />
      <div className="pointer-events-none absolute left-[15%] bottom-0 h-48 w-80 md:h-72 md:w-[32rem] rounded-full bg-amber-500/10 blur-2xl md:blur-3xl glow-pulse" style={{ animationDelay: "5s" }} />
      <div className="pointer-events-none absolute right-[10%] top-[15%] h-40 w-40 md:h-64 md:w-64 rounded-full bg-emerald-500/10 blur-2xl md:blur-3xl glow-pulse" style={{ animationDelay: "3.5s" }} />

      {/* Dotted grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] md:opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Flour dust — fewer on mobile */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        {Array.from({ length: 22 }).map((_, i) => {
          const left = (i * 53) % 100;
          const dur = 12 + ((i * 7) % 14);
          const delay = (i * 1.3) % 10;
          const size = 2 + (i % 3);
          const dx = ((i % 5) - 2) * 20;
          return (
            <span
              key={i}
              className="dust absolute rounded-full bg-white/60"
              style={{
                left: `${left}%`,
                bottom: `-10px`,
                width: size,
                height: size,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                "--dx": `${dx}px`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Top bar */}
        <header className="flex items-center justify-between text-xs sm:text-sm text-white/60">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-accent" />
            <span className="tracking-[0.2em] uppercase text-[10px] sm:text-xs">Kitchen Void · Error 404</span>
          </div>
          <Link href="/" className="hover:text-white transition-colors">← Back</Link>
        </header>

        {/* Headline */}
        <div className="mt-10 sm:mt-14 md:mt-20 text-center">
          <p className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.4em] text-accent">
            Order status
          </p>
          <h1 className="mt-3 sm:mt-4 font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold leading-[1.05] sm:leading-[0.95] text-white">
            This dish isn't
            <br />
            <span className="italic text-accent">on the menu.</span>
          </h1>
          <p className="mx-auto mt-3 sm:mt-5 max-w-md sm:max-w-xl text-sm sm:text-base md:text-lg text-white/70 px-2">
            Looks like that recipe failed. The page you're craving has drifted
            off into the kitchen void — but the pass is still hot.
          </p>
        </div>

        {/* Animation belt */}
        <div className="relative mt-10 sm:mt-14 md:mt-20">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-24 bg-gradient-to-r from-[#141210] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-24 bg-gradient-to-l from-[#141210] to-transparent" />

          <div className="relative overflow-hidden py-4 sm:py-6">
            <div className="drift-track flex items-end gap-10 sm:gap-16 md:gap-24">
              {track.map(({ Comp, size, extra }, i) => (
                <div key={i} className={`shrink-0 ${size}`}>
                  <div className={`h-full w-full ${extra}`}>
                    <Comp />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-1.5 sm:mt-2 h-px w-11/12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* CTA */}
        <div className="mt-10 sm:mt-14 md:mt-20 flex flex-col items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 sm:gap-3 rounded-full bg-accent px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium text-[#0a1f18] shadow-[0_10px_40px_-8px_rgba(244,183,64,0.45)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Return to Home Page
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>

        </div>

        <div className="flex-1 min-h-[2rem]" />

        {/* Footer */}
        <footer className="mt-10 sm:mt-16 border-t border-white/10 pt-5 sm:pt-6 pb-2">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-8 gap-y-2 sm:gap-y-3 text-xs sm:text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="opacity-30 hidden sm:inline">·</span>
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <span className="opacity-30 hidden sm:inline">·</span>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <span className="opacity-30 hidden sm:inline">·</span>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <span className="opacity-30 hidden sm:inline">·</span>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </nav>
          <p className="mt-3 sm:mt-4 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-white/40">
            Served fresh from the kitchen void
          </p>
        </footer>
      </div>
    </div>
  );
}
