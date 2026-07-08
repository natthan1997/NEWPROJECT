const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/pub-[a-zA-Z0-9-]+\.r2\.dev\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'r2-images',
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
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
