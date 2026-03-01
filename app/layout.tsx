'use client';

import { NimbusShell } from "@tiendanube/components";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" />
      </head>
      <body>
        <NimbusShell>
          {children}
        </NimbusShell>
      </body>
    </html>
  );
}
