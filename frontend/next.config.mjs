/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  serverExternalPackages: [],

  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*/`,
      },
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*/`,
      },
      {
        source: '/media/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/media/:path*`,
      },
    ]
  },
}

export default nextConfig