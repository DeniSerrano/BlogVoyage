'use client';
import React, { useState } from 'react';
// Importamos solo lo más básico y seguro de Nimbus
import { Card, Text, Input, Button } from '@tiendanube/components';

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
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <Text variant="headingLg">Migrador de Productos WordPress</Text>
      </div>
      
      <Card>
        <Card.Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Text>Ingresá la URL de tu sitio WordPress para comenzar la sincronización.</Text>
            
            <Input 
              label="URL del sitio origen"
              placeholder="https://tu-tienda-wp.com" 
              value={wpUrl}
              onChange={(e) => setWpUrl(e.target.value)}
            />
            
            <div style={{ marginTop: '10px' }}>
              <Button 
                variant="primary" 
                loading={loading}
                onClick={handleImport}
              >
                Comenzar Importación
              </Button>
            </div>
          </div>
        </Card.Section>
      </Card>

      {status.message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          borderRadius: '8px',
          backgroundColor: status.type === 'error' ? '#fff1f0' : '#f6ffed',
          border: `1px solid ${status.type === 'error' ? '#ffa39e' : '#b7eb8f'}`,
          color: 'rgba(0, 0, 0, 0.85)'
        }}>
          <Text>{status.message}</Text>
        </div>
      )}
    </div>
  );
}
