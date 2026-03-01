'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Text, 
  Input, 
  Button, 
  Stack, 
  PageTitle 
} from "@tiendanube/components";

export default function Page() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url) return alert('Ingresa una URL de WordPress');
    setLoading(true);
    
    // Aquí irá la lógica que armamos antes
    console.log('Importando desde:', url);
    
    setTimeout(() => {
      setLoading(false);
      alert('Proceso iniciado (revisa la consola)');
    }, 2000);
  };

  return (
    <Stack spacing="loose">
      <PageTitle
        title="Importador WordPress a Tiendanube"
        subtitle="Convierte tus posts de blog en páginas de contenido"
      />
      
      <Card>
        <Card.Section>
          <Stack spacing="tight">
            <Text>URL de tu WordPress</Text>
            <Input
              placeholder="https://tu-sitio-wp.com"
              value={url}
              onChange={(e: any) => setUrl(e.target.value)}
            />
            <Button 
              appearance="primary" 
              loading={loading}
              onClick={handleImport}
            >
              Comenzar Importación
            </Button>
          </Stack>
        </Card.Section>
      </Card>
    </Stack>
  );
}
