/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com', pathname: '**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '**' },
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },

  // Add this rewrites section:
  async rewrites() {
    return [
      {
        source: '/admin',
        destination: 'https://mvg-admin-ten.vercel.app/',
      },
      {
        source: '/admin/:path*',
        destination: 'https://mvg-admin-ten.vercel.app/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
