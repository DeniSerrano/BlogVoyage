'use client';

import React, { useEffect, useState } from 'react';
import nexo from '@tiendanube/nexo';

const nexoClient = nexo();

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    nexoClient
      .connect()
      .then(() => {
        setConnected(true);
      })
      .catch((err: any) => {
        setError(err?.message || 'Error conectando con Nexo');
      });
  }, []);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: 32,
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
        WP Importer
      </h1>
      {connected ? (
        <p style={{ color: '#36B37E' }}>✅ Conectado con Nexo correctamente</p>
      ) : error ? (
        <p style={{ color: '#FF5630' }}>❌ {error}</p>
      ) : (
        <p style={{ color: '#6B7280' }}>⏳ Conectando con el admin...</p>
      )}
    </div>
  );
}
