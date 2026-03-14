import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors https://*.mitiendanube.com https://*.mynuvemshop.com https://*.lojanuvem.com.br https://admin.tiendanube.com https://admin.nuvemshop.com.br https://*.vercel.app;",
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://admin.tiendanube.com',
          },
        ],
      },
    ];
  },
};
export default nextConfig;
