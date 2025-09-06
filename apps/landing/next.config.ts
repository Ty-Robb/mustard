import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/ui'],
  images: {
    domains: ['images.unsplash.com'], // Add any image domains you'll use
  },
};

export default nextConfig;
