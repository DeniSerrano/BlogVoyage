'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    const sid = searchParams.get('store_id');
    if (sid) setStoreId(sid);
  }, [searchParams]);

  const handleImport = async () => {
    setLoading(true);
    setMessages(['⏳ Conectando con WordPress...']);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpUrl: url, storeId }),
      });

      const data = await res.json();

      if (data.success) {
        const results = data.processed.map((p: any) =>
          `${p.success ? '✅' : '❌'} ${p.title}`
        );
        setMessages(['🚀 ¡Importación finalizada!', ...results]);
      } else {
        setMessages([`❌ Error: ${data.error}`]);
      }
    } catch (err) {
      setMessages(['❌ Error crítico al intentar importar.']);
    } finally {
      setLoading(false);
    }
  };

  // Si no hay store_id, mostrar botón para autenticar
  if (!storeId) {
    return (
      <div style={{
        padding: '40px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        maxWidth: '600px',
        margin: '40px auto',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Importador de WordPress</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Primero conectá tu tienda de Tiendanube para poder importar.
        </p>
        <a
          href="/api/auth"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            textDecoration: 'none'
          }}
        >
          Conectar con Tiendanube
        </a>
      </div>
    );
  }

  return (
    <div style={{
      padding: '40px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      maxWidth: '600px',
      margin: '40px auto',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Importador de WordPress</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Ingresá la URL de tu blog para convertir los posts en páginas de tu Tiendanube.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>URL de WordPress</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tu-sitio-web.com"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          onClick={handleImport}
          disabled={loading || !url}
          style={{
            padding: '12px',
            background: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          {loading ? 'Sincronizando...' : 'Comenzar Importación'}
        </button>
      </div>

      {messages.length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          borderLeft: '4px solid #0070f3'
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '14px' }}>{m}</div>
          ))}
        </div>
      )}
    </div>
  );
}
