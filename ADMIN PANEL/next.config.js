/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 1. Add basePath for sub-path routing
  basePath: '/admin',
  
  // 2. Increase the limit for PDF uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },

  // 3. Keep your existing image configurations
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com', pathname: '**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '**' },
    ],
  },

  // 4. Fix the pdf-parse 'fs' dependency error
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;