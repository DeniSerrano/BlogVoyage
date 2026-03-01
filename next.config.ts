/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tiendanube/components'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
