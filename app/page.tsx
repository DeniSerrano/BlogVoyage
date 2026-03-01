'use client';
import React, { useState } from 'react';
import { Card, Text, Input, Button } from '@tiendanube/components';

export default function Home() {
  const [wpUrl, setWpUrl] = useState('');
  const [status, setStatus] = useState({ type: 'default', message: '' });

  const handleImport = async () => {
    setStatus({ type: 'primary', message: 'Iniciando importación...' });
    
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpUrl }),
      });
      if (res.ok) {
        setStatus({ type: 'success', message: '¡Importación finalizada!' });
      } else {
        setStatus({ type: 'danger', message: 'Error al importar.' });
      }
    } catch (e) {
      setStatus({ type: 'danger', message: 'Error de conexión.' });
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '700px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Text appearance="primary">Migrador de Productos WordPress</Text>
      </div>
      
      <Card title="Configuración">
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <Text appearance="default">Ingresá la URL de tu WordPress:</Text>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Input 
              name="wordpress_url"
              placeholder="https://tu-sitio-wp.com" 
              value={wpUrl}
              onChange={(e: any) => setWpUrl(e.value || e.target?.value || e)}
            />
            
            <div style={{ marginTop: '10px' }}>
              <Button 
                appearance="primary"
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
