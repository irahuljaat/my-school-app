/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add the images configuration object here to allow Cloudinary domain
  images: {
    domains: [
      // This is the standard domain used by Cloudinary for image delivery
      'res.cloudinary.com',
      'encrypted-tbn0.gstatic.com',
    ],
  },
  // Ensure strict mode is set up
  reactStrictMode: true,
};

// Use CommonJS export syntax
module.exports = nextConfig;