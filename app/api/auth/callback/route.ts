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

    // Obtener info de la tienda para el redirect correcto
    const storeRes = await fetch(
      `https://api.tiendanube.com/v1/${data.user_id}/store`,
      {
        headers: {
          'Authentication': `bearer ${data.access_token}`,
          'User-Agent': 'WP-Importer (admin@example.com)',
          'Content-Type': 'application/json',
        },
      }
    );
    const storeData = await storeRes.json();

    // Guardar en Supabase (con info extra de la tienda)
    const { error: dbError } = await supabase.from('tiendas').upsert(
      {
        store_id: String(data.user_id),
        access_token: data.access_token,
        store_name: storeData.name?.es || storeData.name?.pt || storeData.name?.en || '',
        store_url: storeData.url_with_protocol || '',
        store_email: storeData.email || '',
      },
      { onConflict: 'store_id' }
    );

    if (dbError) {
      console.error('Error guardando en Supabase:', dbError);
      return NextResponse.json({ error: 'Error guardando credenciales' }, { status: 500 });
    }

    console.log(`Tienda ${data.user_id} autenticada correctamente`);

    // CRITICAL: Redirigir al admin de la tienda, NO a la URL de Vercel
    // Tiendanube usa dominios por tienda: https://{store}.mitiendanube.com/admin/apps/{app_id}
    const originalDomain = storeData.original_domain || storeData.main_domain;
    const appId = process.env.TIENDANUBE_CLIENT_ID;
    const redirectUrl = `https://${originalDomain}/admin/apps/${appId}/`;

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Error en callback:', error.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
