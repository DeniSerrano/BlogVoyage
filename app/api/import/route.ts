import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { wpUrl, storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'No se indicó el store_id. Autenticá tu tienda primero.' },
        { status: 400 }
      );
    }

    // Buscar el access_token en Supabase
    const { data: tienda, error: dbError } = await supabase
      .from('tiendas')
      .select('access_token')
      .eq('store_id', storeId)
      .single();

    if (dbError || !tienda?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Tienda no autenticada. Instalá la app primero.' },
        { status: 401 }
      );
    }

    const accessToken = tienda.access_token;
    const cleanUrl = wpUrl.replace(/\/$/, '');

    // Obtener posts de WordPress
    const wpRes = await fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=10`);
    if (!wpRes.ok) throw new Error('WordPress no respondió correctamente.');
    const posts = await wpRes.json();

    const results = [];
    for (const post of posts) {
      const slug = post.title.rendered
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const tnRes = await fetch(
        `https://api.tiendanube.com/2025-03/${storeId}/pages`,
        {
          method: 'POST',
          headers: {
            'Authentication': `bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'WP-Importer (admin@example.com)',
          },
          body: JSON.stringify({
            page: {
              i18n: {
                es: {
                  title: post.title.rendered,
                  handle: slug,
                  content: post.content.rendered,
                },
              },
              publish: true,
            },
          }),
        }
      );

      if (!tnRes.ok) {
        const errorData = await tnRes.json();
        console.error(`Fallo en Tiendanube:`, errorData);
      }

      results.push({
        title: post.title.rendered,
        success: tnRes.ok,
      });
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error('Error Crítico:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
