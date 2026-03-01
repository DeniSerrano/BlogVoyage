'use client';
import React, { useState } from 'react';

export default function Home() {
  const [wpUrl, setWpUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleImport = async () => {
    setLoading(true);
    setStatus('Iniciando...');
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get('store_id');

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: JSON.stringify({ wpUrl, storeId }),
      });
      const data = await res.json();
      setStatus(data.message || data.error);
    } catch (e) {
      setStatus('Error al conectar');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Migrador de Productos</h1>
      <p>Copia la URL de tu WordPress abajo:</p>
      <input 
        type="text" 
        value={wpUrl} 
        onChange={(e) => setWpUrl(e.target.value)}
        placeholder="https://tu-sitio.com"
        style={{ padding: '10px', width: '300px', borderRadius: '5px', border: '1px solid #ccc' }}
      />
      <br /><br />
      <button 
        onClick={handleImport} 
        disabled={loading}
        style={{ padding: '10px 20px', backgroundColor: '#00a8ff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        {loading ? 'Cargando...' : 'Comenzar Importación'}
      </button>
      {status && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{status}</p>}
    </div>
  );
}