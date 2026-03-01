'use client';

import { NimbusShell } from "@tiendanube/components";
import "@tiendanube/components/dist/index.css";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <NimbusShell>
          {children}
        </NimbusShell>
      </body>
    </html>
  );
}
