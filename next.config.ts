/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tiendanube/components'],
  // Forzamos a que no use Turbopack si el entorno es producción
  turbo: {
    rules: {
      "*.css": ["css-loader"],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
