'use client';
import React, { useState } from 'react';
import { Card, Text, Input, Button } from '@tiendanube/components';

export default function Home() {
  const [wpUrl, setWpUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleImport = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Iniciando importación...' });
    
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
        setStatus({ type: 'error', message: 'Error al importar productos.' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Error de red.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        {/* Usamos "featured" que es lo que tu error dijo que sí acepta */}
        <Text appearance="featured">Migrador de Productos WordPress</Text>
      </div>
      
      <Card>
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text appearance="base">Configura la URL de tu sitio WordPress para sincronizar con tu Tiendanube.</Text>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input 
              placeholder="https://tu-sitio-wp.com" 
              value={wpUrl}
              onChange={(e) => setWpUrl(e.target.value)}
            />
            
            <div style={{ width: 'fit-content' }}>
              <Button 
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
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          backgroundColor: status.type === 'error' ? '#fff1f0' : '#f6ffed'
        }}>
          <Text appearance="base">{status.message}</Text>
        </div>
      )}
    </div>
  );
}
