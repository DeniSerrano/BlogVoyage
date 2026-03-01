'use client';
import React, { useState } from 'react';
// Importamos solo lo más básico
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
        setStatus({ type: 'success', message: '¡Importación completada!' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Error en la importación' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Error de conexión' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        {/* Quitamos el 'variant' que causó el último error */}
        <Text size="large" weight="bold">Migrador de Productos WordPress</Text>
      </div>
      
      <Card>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Text>Copia la URL de tu WordPress abajo para empezar:</Text>
          
          <Input 
            placeholder="https://tu-sitio.com" 
            value={wpUrl}
            onChange={(e) => setWpUrl(e.target.value)}
          />
          
          <div style={{ marginTop: '10px' }}>
            <Button 
              loading={loading}
              onClick={handleImport}
            >
              Comenzar Importación
            </Button>
          </div>
        </div>
      </Card>

      {status.message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          borderRadius: '4px',
          backgroundColor: status.type === 'error' ? '#fff1f0' : '#f6ffed',
          border: '1px solid #ccc'
        }}>
          <Text>{status.message}</Text>
        </div>
      )}
    </div>
  );
}
