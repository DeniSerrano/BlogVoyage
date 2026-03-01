'use client';
import React, { useState } from 'react';
import { AppShell, Card, Text, Input, Button, Stack, Banner, Box } from '@tiendanube/components';

export default function Home() {
  const [wpUrl, setWpUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleImport = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Conectando con WordPress...' });
    
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get('store_id');

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: JSON.stringify({ wpUrl, storeId }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', message: '¡Importación completada con éxito!' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Error en la importación' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'No se pudo conectar con el servidor' });
    }
    setLoading(false);
  };

  return (
    <AppShell>
      <Box padding="5">
        <Stack spacing="5">
          <Text variant="headingLg">Migrador de Productos WordPress</Text>
          
          <Card>
            <Card.Section>
              <Stack spacing="4">
                <Text>Ingresá la URL de tu sitio WordPress para comenzar a sincronizar tus productos con Tiendanube.</Text>
                <Input 
                  label="URL del sitio origen"
                  placeholder="https://tu-tienda-wp.com" 
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                />
                <Button 
                  variant="primary" 
                  appearance="primary"
                  loading={loading}
                  onClick={handleImport}
                >
                  Comenzar Importación
                </Button>
              </Stack>
            </Card.Section>
          </Card>

          {status.message && (
            <Banner 
              title={status.message} 
              type={status.type as any}
            />
          )}
        </Stack>
      </Box>
    </AppShell>
  );
}
