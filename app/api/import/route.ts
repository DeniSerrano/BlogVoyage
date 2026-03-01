import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { wpUrl, storeId, selectedIds, overwrite } = await request.json();

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'No se indicó el store_id. Autenticá tu tienda primero.' },
        { status: 400 }
      );
    }

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
    const wpRes = await fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=20`);
    if (!wpRes.ok) throw new Error('WordPress no respondió correctamente.');
    const allPosts = await wpRes.json();

    // Filtrar solo los seleccionados
    const posts = selectedIds
      ? allPosts.filter((p: any) => selectedIds.includes(p.id))
      : allPosts;

    // Si overwrite está activo, obtener páginas existentes para buscar IDs
    let existingPageMap: Record<string, number> = {};
    if (overwrite) {
      const tnPagesRes = await fetch(`https://api.tiendanube.com/2025-03/${storeId}/pages`, {
        headers: {
          'Authentication': `bearer ${accessToken}`,
          'User-Agent': 'WP-Importer (admin@example.com)',
        },
      });
      if (tnPagesRes.ok) {
        const pagesData = await tnPagesRes.json();
        const pages = pagesData?.pages?.results || [];
        for (const page of pages) {
          if (page.handle) {
            for (const lang of Object.keys(page.handle)) {
              existingPageMap[page.handle[lang]] = page.id;
            }
          }
        }
      }
    }

    const results = [];
    for (const post of posts) {
      const slug = post.title.rendered
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const title = post.title.rendered.length > 50
        ? post.title.rendered.substring(0, 47) + '...'
        : post.title.rendered;

      const existingPageId = existingPageMap[slug];

      let tnRes;
      if (overwrite && existingPageId) {
        // Sobreescribir página existente (PUT)
        tnRes = await fetch(
          `https://api.tiendanube.com/2025-03/${storeId}/pages/${existingPageId}`,
          {
            method: 'PUT',
            headers: {
              'Authentication': `bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'User-Agent': 'WP-Importer (admin@example.com)',
            },
            body: JSON.stringify({
              title: title,
              content: post.content.rendered,
            }),
          }
        );
      } else {
        // Crear nueva página (POST)
        tnRes = await fetch(
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
                publish: true,
                i18n: {
                  es_AR: {
                    title: title,
                    content: post.content.rendered,
                    seo_handle: slug,
                    seo_title: post.title.rendered,
                    seo_description: '',
                  },
                },
              },
            }),
          }
        );
      }

      if (!tnRes.ok) {
        const errorData = await tnRes.json();
        console.error(`Fallo en Tiendanube:`, errorData);
      }

      results.push({
        wpId: post.id,
        title: post.title.rendered,
        success: tnRes.ok,
        overwritten: overwrite && !!existingPageId,
      });
    }

    // Guardar en historial
    await supabase.from('import_history').insert({
      store_id: storeId,
      source_url: cleanUrl,
      total_posts: posts.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    }).then(() => {}).catch(() => {});

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    console.error('Error Crítico:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
