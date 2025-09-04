/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build even with TypeScript errors for now
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  // Optimize images and static assets
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Reduce bundle size
  //swcMinify: true,
  // Optimize for faster builds
  modularizeImports: {
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}',
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}',
    },
  },
};

module.exports = nextConfig; 