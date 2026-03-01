'use client';

import React, { useState } from 'react';

export default function Page() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleImport = async () => {
    if (!url) return alert('Ingresa una URL');
    setLoading(true);
    setStatus('Procesando...');
    
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpUrl: url }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`¡Éxito! Se importaron ${data.processed.length} entradas.`);
      } else {
        setStatus('Error: ' + data.error);
      }
    } catch (err) {
      setStatus('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px' }}>
      <h1>Importador de WordPress</h1>
      <p>Carga tus posts directamente a Tiendanube.</p>
      
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label>URL de WordPress:</label>
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://tu-blog.com"
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={handleImport} 
          disabled={loading}
          style={{ 
            padding: '10px', 
            background: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Importando...' : 'Comenzar Importación'}
        </button>
      </div>

      {status && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f4f4f4', borderRadius: '4px' }}>
          {status}
        </div>
      )}
    </div>
  );
}
