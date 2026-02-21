import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // For kuromoji dictionary loading
  serverExternalPackages: ['kuromoji'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
