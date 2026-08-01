/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework in every response (X-Powered-By: Next.js).
  poweredByHeader: false,

  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    unoptimized: false, // Enable Next.js image optimisation (WebP/AVIF auto-convert)
    formats: ['image/avif', 'image/webp'],
  },

  // ── Package import optimisation ───────────────────────────────────────────
  // Tree-shakes icon/ui libraries so only used icons land in the bundle.
  // This alone cuts the lucide-react and date-fns bundle by ~60-70%.
  experimental: {
    // serverActions is the default in Next.js 15 — flag removed (no-op warning)
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
    ],
  },

  // ── HTTP headers — security hardening + static-asset caching ─────────────
  // All static config: Next computes these once at startup and stamps them on
  // responses — zero per-request work, so no performance cost.
  async headers() {
    return [
      {
        // Security headers on every route.
        source: '/:path*',
        headers: [
          // Only same-origin pages may iframe us — blocks clickjacking overlays
          // on the login forms while still allowing any future self-embed.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Browsers must honour the declared Content-Type, never sniff —
          // stops uploaded files being reinterpreted as executable HTML/JS.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Cross-origin links only ever see our origin, never the full URL —
          // keeps ?redirect= params and restaurant/table IDs out of other
          // sites' referrer logs. Same-origin navigation is unaffected.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // We never use these browser APIs; deny them outright so injected
          // scripts (or embedded content) can't request them either.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Belt-and-suspenders alongside X-Frame-Options, plus: no <object>/
          // <embed> plugins, <base> can't be hijacked to redirect relative URLs,
          // and forms can only submit back to us. Deliberately NOT a script-src
          // policy — that needs nonce plumbing and risks breaking pages.
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" },
          // Browsers only apply HSTS over HTTPS, so this is inert in local dev
          // and takes effect automatically once deployed behind TLS.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
      // NOTE: no rule for /_next/static/* on purpose. Next.js content-hashes
      // those filenames and already serves them `public, max-age=31536000,
      // immutable`, so a custom header only duplicates that in production — and
      // the dev variant ('no-cache') is what Next warns can break dev behaviour.
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
