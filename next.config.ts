/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sin transpilePackages ni cosas raras por ahora
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
