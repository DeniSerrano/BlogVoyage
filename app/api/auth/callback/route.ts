import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No se recibió el código de autorización' }, { status: 400 });
  }

  try {
    // Intercambiar el code por access_token
    const response = await fetch('https://www.tiendanube.com/apps/authorize/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WP-Importer (admin@example.com)',
      },
      body: JSON.stringify({
        client_id: process.env.TIENDANUBE_CLIENT_ID,
        client_secret: process.env.TIENDANUBE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code.trim(),
      }),
    });

    const data = await response.json();

    if (!data.access_token || !data.user_id) {
      console.error('Error de Tiendanube:', data);
      return NextResponse.json(
        { error: 'No se pudo obtener el token', details: data },
        { status: 401 }
      );
    }

    // Guardar en Supabase
    const { error: dbError } = await supabase.from('tiendas').upsert(
      {
        store_id: String(data.user_id),
        access_token: data.access_token,
      },
      { onConflict: 'store_id' }
    );

    if (dbError) {
      console.error('Error guardando en Supabase:', dbError);
      return NextResponse.json({ error: 'Error guardando credenciales' }, { status: 500 });
    }

    console.log(`Tienda ${data.user_id} autenticada correctamente`);

    // Redirigir al home con el store_id
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/?store_id=${data.user_id}`);
  } catch (error: any) {
    console.error('Error en callback:', error.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
