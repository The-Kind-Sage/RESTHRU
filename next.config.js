/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // ── HTTP headers — cache static assets aggressively ──────────────────────
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value:
              process.env.NODE_ENV === 'production'
                ? 'public, max-age=31536000, immutable'
                : 'no-cache, must-revalidate',
          },
        ],
      },
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
