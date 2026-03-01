'use client';
import React, { useState } from 'react';
import { Card, Text, Input, Button } from '@tiendanube/components';

export default function Home() {
  const [wpUrl, setWpUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleImport = async () => {
    setLoading(true);
    setStatus({ type: 'primary', message: 'Iniciando importación...' });
    
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get('store_id');

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpUrl, storeId }),
      });
      if (res.ok) {
        setStatus({ type: 'success', message: '¡Importación finalizada!' });
      } else {
        setStatus({ type: 'danger', message: 'Error al importar.' });
      }
    } catch (e) {
      setStatus({ type: 'danger', message: 'Error de red.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '700px' }}>
      <div style={{ marginBottom: '20px' }}>
        {/* Usamos "primary" que Vercel confirmó que sí acepta en tu captura */}
        <Text appearance="primary">Migrador de Productos WordPress</Text>
      </div>
      
      <Card>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <Text appearance="default">Ingresá la URL de tu WordPress:</Text>
          </div>
          
          <Input 
            placeholder="https://tu-sitio-wp.com" 
            value={wpUrl}
            onChange={(e) => setWpUrl(e.target.value)}
          />
          
          <div style={{ marginTop: '20px' }}>
            <Button 
              appearance="primary"
              loading={loading}
              onClick={handleImport}
            >
              Comenzar Importación
            </Button>
          </div>
        </div>
      </Card>

      {status.message && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc' }}>
          <Text appearance={status.type as any}>{status.message}</Text>
        </div>
      )}
    </div>
  );
}
