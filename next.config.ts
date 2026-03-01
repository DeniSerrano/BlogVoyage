/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tiendanube/components'],
  // Esto ayuda a que los estilos y componentes se carguen correctamente
  experimental: {
    // Si usas Next 15, esto ayuda con librerías externas
    serverComponentsExternalPackages: ['@tiendanube/components'],
  },
};

export default nextConfig;
