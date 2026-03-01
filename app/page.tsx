'use client';
import React, { useState, useEffect } from 'react';
import { Card, Text, Input, Button } from '@tiendanube/components';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [wpUrl, setWpUrl] = useState('');
  const [status, setStatus] = useState({ type: 'default', message: '' });

  // Esto evita errores de hidratación en Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleImport = async () => {
    setStatus({ type: 'primary', message: 'Conectando con WordPress...' });
    // Aquí irá la lógica de importación luego
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="Migrador de Productos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
          <Text>Introduce la URL de tu sitio WordPress para comenzar.</Text>
          
          <Input 
            name="wp-url"
            placeholder="https://tu-sitio.com" 
            value={wpUrl}
            onChange={(e: any) => setWpUrl(e.value || e.target?.value || e)}
          />
          
          <Button 
            appearance="primary"
            onClick={handleImport}
          >
            Comenzar Importación
          </Button>

          {status.message && (
            <div style={{ marginTop: '10px' }}>
              <Text appearance={status.type as any}>{status.message}</Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
