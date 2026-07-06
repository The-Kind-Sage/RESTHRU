/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

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
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
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
