/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb'
    }
  },
  api: {
    bodyParser: {
      sizeLimit: '100mb'
    },
    responseLimit: '100mb'
  },
  allowedDevOrigins: ['192.168.1.9:3000', 'localhost:3000'],
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig 