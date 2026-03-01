'use client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [wpUrl, setWpUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Forzamos a que el componente solo se cargue en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleImport = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#f0f0f7', 
      minHeight: '100vh',
      fontFamily: 'sans-serif' 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Migrador de WordPress</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Ingresá la URL de tu sitio para empezar a importar productos a tu Tiendanube.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>URL del sitio WordPress</label>
          <input 
            type="text"
            placeholder="https://tu-sitio-web.com"
            value={wpUrl}
            onChange={(e) => setWpUrl(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button 
          onClick={handleImport}
          disabled={loading}
          style={{ 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            padding: '12px 25px', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          {loading ? 'Conectando...' : 'Comenzar Importación'}
        </button>
      </div>
    </div>
  );
}
