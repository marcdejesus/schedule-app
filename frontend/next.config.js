/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001',
  },
  async rewrites() {
    // Use internal Docker service name for server-side proxy
    const internalApiUrl = process.env.INTERNAL_API_URL || 'http://api:3001'
    return [
      {
        source: '/api/:path*',
        destination: `${internalApiUrl}/api/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 