'use client';
import React, { useState } from 'react';
import { Card, Text, Input, Button } from '@tiendanube/components';

export default function Home() {
  const [wpUrl, setWpUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: 'default', message: '' });

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
        <Text appearance="primary">Migrador de Productos WordPress</Text>
      </div>
      
      <Card title="Configuración de Importación">
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <Text appearance="default">Ingresá la URL de tu sitio WordPress:</Text>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Agregamos el "name" que Vercel exigió en el último error */}
            <Input 
              name="wordpress_url"
              placeholder="https://tu-sitio-wp.com" 
              value={wpUrl}
              onChange={(e) => setWpUrl(e.target.value)}
            />
            
            <div style={{ marginTop: '10px' }}>
              <Button 
                name="btn_import"
                appearance="primary"
                loading={loading}
                onClick={handleImport}
              >
                Comenzar Importación
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {status.message && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <Text appearance={status.type as any}>{status.message}</Text>
        </div>
      )}
    </div>
  );
}
