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
        'User-Agent': 'BlogVoyage (support@blogvoyage.app)',
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

    const storeId = String(data.user_id);
    const tnHeaders = {
      Authentication: `bearer ${data.access_token}`,
      'User-Agent': 'BlogVoyage (support@blogvoyage.app)',
      'Content-Type': 'application/json',
    };

    // Obtener info de la tienda para el redirect correcto
    const storeRes = await fetch(
      `https://api.tiendanube.com/2025-03/${storeId}/store`,
      { headers: tnHeaders }
    );
    const storeData = await storeRes.json();

    // Obtener blog_id automáticamente desde la API
    let blogId: string | null = null;
    try {
      const blogsRes = await fetch(
        `https://api.tiendanube.com/2025-03/${storeId}/blogs`,
        { headers: tnHeaders }
      );
      if (blogsRes.ok) {
        const blogsData = await blogsRes.json();
        blogId = blogsData?.blog_id || null;
      }
    } catch (err) {
      console.warn(`No se pudo obtener blog_id para tienda ${storeId}:`, err);
    }

    // Guardar en Supabase
    const { error: dbError } = await supabase.from('tiendas').upsert(
      {
        store_id: storeId,
        access_token: data.access_token,
        store_name: storeData.name?.es || storeData.name?.pt || storeData.name?.en || '',
        store_url: storeData.url_with_protocol || '',
        store_email: storeData.email || '',
        ...(blogId ? { blog_id: blogId } : {}),
      },
      { onConflict: 'store_id' }
    );

    if (dbError) {
      console.error('Error guardando en Supabase:', dbError);
      return NextResponse.json({ error: 'Error guardando credenciales' }, { status: 500 });
    }

    console.log(`Tienda ${storeId} autenticada. blog_id: ${blogId ?? 'no disponible'}`);

    // Redirigir al admin de la tienda
    const originalDomain = storeData.original_domain || storeData.main_domain;
    const appId = process.env.TIENDANUBE_CLIENT_ID;
    const redirectUrl = `https://${originalDomain}/admin/apps/${appId}/`;

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Error en callback:', error.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
