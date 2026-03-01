import { NimbusShell } from "@tiendanube/components";
import "@tiendanube/components/dist/index.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Este Shell es el que aplica el diseño oficial a todo lo que esté adentro */}
        <NimbusShell>
          {children}
        </NimbusShell>
      </body>
    </html>
  );
}
