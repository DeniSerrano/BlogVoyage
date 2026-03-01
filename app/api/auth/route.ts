import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Conectamos con la base de datos que armamos en Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code'); // El código que nos da Tiendanube
  const storeId = searchParams.get('store_id');

  if (!code || !storeId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  // 1. Pedir el Access Token a Tiendanube usando las llaves de tu .env.local
  const response = await fetch('https://www.tiendanube.com/apps/authorize/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'WPMigratorApp (tu@email.com)' },
    body: JSON.stringify({
      client_id: process.env.TIENDANUBE_CLIENT_ID,
      client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code
    })
  });

  const data = await response.json();

  // 2. Guardar el token en la tabla "tiendas" de Supabase
  if (data.access_token) {
    await supabase.from('tiendas').upsert({
      store_id: storeId,
      access_token: data.access_token
    }, { onConflict: 'store_id' });
  }

  // 3. Redirigir al usuario a la pantalla principal de tu app
  return NextResponse.redirect(`http://localhost:3000/?store_id=${storeId}`);
}