/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during builds to avoid deprecated warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is done separately, skip during build for speed
    ignoreBuildErrors: false,
  },
  // Disable Next.js telemetry
  telemetry: false,
}

module.exports = nextConfig