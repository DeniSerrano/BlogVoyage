'use client';

import React, { useState, useEffect } from 'react';
import { 
  NimbusShell,
  Card, 
  Text, 
  Input, 
  Button, 
  Stack, 
  PageTitle,
  Alert
} from "@tiendanube/components";

export default function Page() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleImport = async () => {
    if (!url) return alert('Por favor, ingresa una URL de WordPress');
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpUrl: url }),
      });
      
      const data = await response.json();
      if (data.success) {
        setResult({ type: 'success', message: `¡Éxito! Se procesaron ${data.processed.length} entradas.` });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setResult({ type: 'danger', message: 'Error: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <NimbusShell>
      <Stack spacing="loose">
        <PageTitle
          title="Importador de Contenido"
          subtitle="Carga posts de WordPress directamente a tus páginas de Tiendanube"
        />
        
        {result && (
          <Alert appearance={result.type} title={result.message} />
        )}

        <Card>
          <Card.Section>
            <Stack spacing="tight">
              <Text>URL de tu WordPress (ej: https://misitio.com)</Text>
              <Input
                placeholder="https://tu-blog-wp.com"
                value={url}
                onChange={(e: any) => setUrl(e.target.value)}
              />
              <Button 
                appearance="primary" 
                loading={loading}
                onClick={handleImport}
              >
                Sincronizar ahora
              </Button>
            </Stack>
          </Card.Section>
        </Card>
      </Stack>
    </NimbusShell>
  );
}
