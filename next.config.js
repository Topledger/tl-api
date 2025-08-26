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
};

module.exports = nextConfig; 