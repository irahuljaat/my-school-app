/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 1. Increase the limit for PDF uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb', // Increased to 20MB for multiple PDFs
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
};

module.exports = nextConfig;