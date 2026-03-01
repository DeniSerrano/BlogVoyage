'use client';

import React, { useEffect, useState } from 'react';

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initNexo() {
      try {
        // Dynamic import to avoid SSR — nexo needs window
        const { create, connect, iAmReady } = await import('@tiendanube/nexo');
        const nexo = create({
          clientId: process.env.NEXT_PUBLIC_TIENDANUBE_CLIENT_ID || '0',
          log: true,
        });

        await connect(nexo);
        setConnected(true);
        iAmReady(nexo);
      } catch (err: any) {
        setError(err?.message || 'Error conectando con Nexo');
      } finally {
        setLoading(false);
      }
    }

    initNexo();
  }, []);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: 32,
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
        WP Importer
      </h1>
      {loading ? (
        <p style={{ color: '#6B7280' }}>⏳ Conectando con el admin...</p>
      ) : connected ? (
        <p style={{ color: '#36B37E' }}>✅ Conectado con Nexo correctamente</p>
      ) : (
        <p style={{ color: '#FF5630' }}>❌ {error}</p>
      )}
    </div>
  );
}
