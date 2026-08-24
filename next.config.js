/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 1. Increase the limit for PDF uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },

  // 2. Keep your existing image configurations
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com', pathname: '**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '**' },
    ],
  },

  // 3. Fix the pdf-parse 'fs' dependency error
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },

  // 4. Proxy /admin requests to your deployed Admin Panel project
  async rewrites() {
    return [
      {
        source: '/admin',
        destination: 'https://your-admin-panel-deployment-url.vercel.app/admin',
      },
      {
        source: '/admin/:path*',
        destination: 'https://your-admin-panel-deployment-url.vercel.app/admin/:path*',
      },
    ];
  },
};

module.exports = nextConfig;