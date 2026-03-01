'use client';
import React, { useState } from 'react';
// Importamos solo lo que sabemos que funciona seguro
import { Card, Text, Input, Button, Stack, Banner } from '@tiendanube/components';

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
        headers: { 'Content-Type': 'application/json' },
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
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Nunito Sans, sans-serif' }}>
      <Stack spacing="5">
        <Text variant="headingLg">Migrador de Productos WordPress</Text>
        
        <Card>
          <Card.Section title="Configuración de origen">
            <Stack spacing="4">
              <Text>Ingresá la URL de tu sitio WordPress (ej: https://tu-sitio.com) para comenzar la sincronización.</Text>
              <Input 
                label="URL del sitio origen"
                placeholder="https://tu-tienda-wp.com" 
                value={wpUrl}
                onChange={(e) => setWpUrl(e.target.value)}
              />
              <div style={{ marginTop: '15px' }}>
                <Button 
                  variant="primary" 
                  loading={loading}
                  onClick={handleImport}
                >
                  Comenzar Importación
                </Button>
              </div>
            </Stack>
          </Card.Section>
        </Card>

        {status.message && (
          <div style={{ marginTop: '20px' }}>
            <Banner 
              title={status.message} 
              type={status.type as any}
            />
          </div>
        )}
      </Stack>
    </div>
  );
}
