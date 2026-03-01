'use client';

import React, { useState, useEffect } from 'react';
import { 
  NimbusShell,
  Card, 
  Text, 
  Input, 
  Button, 
  Stack, 
  PageTitle 
} from "@tiendanube/components";

export default function Page() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evita errores de hidratación asegurando que el cliente esté listo
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleImport = () => {
    if (!url) return alert('Ingresa una URL');
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <NimbusShell>
      <Stack spacing="loose">
        <PageTitle
          title="Importador WordPress"
          subtitle="Carga tus posts a Tiendanube"
        />
        <Card>
          <Card.Section>
            <Stack spacing="tight">
              <Text>URL de WordPress</Text>
              <Input
                placeholder="https://tu-sitio.com"
                value={url}
                onChange={(e: any) => setUrl(e.target.value)}
              />
              <Button 
                appearance="primary" 
                loading={loading}
                onClick={handleImport}
              >
                Comenzar
              </Button>
            </Stack>
          </Card.Section>
        </Card>
      </Stack>
    </NimbusShell>
  );
}
