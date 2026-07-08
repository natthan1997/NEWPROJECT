const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is stable in Next.js 13.4+, no need for experimental.appDir
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
    ]
  },
}

module.exports = withPWA(nextConfig)
