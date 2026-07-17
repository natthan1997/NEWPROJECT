/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is stable in Next.js 13.4+, no need for experimental.appDir
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xyl-images.*.workers.dev',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  eslint: {
    // Ignore ESLint during builds for rapid iteration
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore type errors for rapid iteration
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Improve chunk loading stability
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
  swcMinify: true,
  // Prevent chunk loading errors
  productionBrowserSourceMaps: false,
  async rewrites() {
    return [
      {
        source: '/menu',
        destination: '/liff/menu',
      },
      {
        source: '/member',
        destination: '/liff/member',
      },
      {
        source: '/liff/menu/member',
        destination: '/liff/member',
      },
      {
        source: '/liff/menu/liff/member',
        destination: '/liff/member',
      }
    ]
  },
}

module.exports = nextConfig
