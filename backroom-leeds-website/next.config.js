/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // App Router is enabled by default in Next.js 15.5 - no configuration needed
  images: {
    domains: ['localhost'],
  },
  // Experimental features can be added here when needed
  experimental: {},
}

module.exports = nextConfig