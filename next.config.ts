/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tiendanube/components'],
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
