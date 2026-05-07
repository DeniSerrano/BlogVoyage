import { NextResponse } from 'next/server';
import { setTienda, setLastStoreId } from '@/lib/kv';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No se recibió el código de autorización' }, { status: 400 });
  }

  try {
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
      console.error('Error de Tiendanube:', JSON.stringify(data));
      return NextResponse.json({ error: 'No se pudo obtener el token' }, { status: 401 });
    }

    const storeId = String(data.user_id);
    const tnHeaders = {
      Authentication: `bearer ${data.access_token}`,
      'User-Agent': 'BlogVoyage (support@blogvoyage.app)',
      'Content-Type': 'application/json',
    };

    const storeRes = await fetch(
      `https://api.tiendanube.com/2025-03/${storeId}/store`,
      { headers: tnHeaders }
    );
    const storeData = await storeRes.json();

    // Obtener blog_id automáticamente
    let blogId: string | null = null;
    try {
      const blogsRes = await fetch(
        `https://api.tiendanube.com/2025-03/${storeId}/blogs`,
        { headers: tnHeaders }
      );
      if (blogsRes.ok) {
        const blogsData = await blogsRes.json();
        blogId = blogsData?.blog_id ?? null;
      }
    } catch (err) {
      console.warn(`No se pudo obtener blog_id para tienda ${storeId}:`, err);
    }

    await setTienda({
      store_id: storeId,
      access_token: data.access_token,
      blog_id: blogId,
      store_name: storeData.name?.es || storeData.name?.pt || storeData.name?.en || '',
      store_url: storeData.url_with_protocol || '',
      store_email: storeData.email || '',
    });

    await setLastStoreId(storeId);

    console.log(`Tienda ${storeId} autenticada. blog_id: ${blogId ?? 'no disponible'}`);

    const originalDomain = storeData.original_domain || storeData.main_domain;
    const appId = process.env.TIENDANUBE_CLIENT_ID;
    return NextResponse.redirect(`https://${originalDomain}/admin/apps/${appId}/`);
  } catch (error: any) {
    console.error('Error en callback:', error.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
