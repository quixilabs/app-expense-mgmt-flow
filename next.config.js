/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove any "output: 'export'" configuration if present
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
