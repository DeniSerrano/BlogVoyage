/** @type {import('next').NextConfig} */
const nextConfig = {
  // Obliga a Next.js a procesar la librería de Tiendanube
  transpilePackages: ['@tiendanube/components'],
  
  // Desactiva indicadores que pueden molestar en el iframe de Tiendanube
  devIndicators: {
    appIsrStatus: false,
  },
  
  // Configuración para evitar errores de hidratación con componentes viejos
  reactStrictMode: false,
};

export default nextConfig;
