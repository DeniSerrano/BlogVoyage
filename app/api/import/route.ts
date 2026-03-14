import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Limpieza de HTML con Claude ───
async function cleanHtmlWithClaude(html: string): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `Limpiá el siguiente HTML que viene de WordPress. 

REGLAS:
- Eliminá todas las clases CSS (atributo class)
- Eliminá todos los estilos inline (atributo style)
- Eliminá atributos data-* innecesarios
- Eliminá shortcodes de WordPress: [caption], [gallery], [embed], [vc_*], [et_*] y similares
- Eliminá comentarios HTML
- Eliminá divs y spans vacíos o puramente decorativos sin contenido semántico
- Eliminá atributos id innecesarios
- Mantené intactos: párrafos (p), títulos (h1-h6), listas (ul, ol, li), negrita (strong, b), itálica (em, i), links (a con href), imágenes (img con src y alt), tablas
- Mantené el contenido textual exactamente igual, sin reescribir ni resumir nada
- Devolvé SOLO el HTML limpio, sin explicaciones, sin markdown, sin bloques de código

HTML a limpiar:
${html}`,
          },
        ],
      }),
    });

    if (!response.ok) return html;
    const data = await response.json();
    const cleaned = data.content?.[0]?.text;
    return cleaned || html;
  } catch {
    // Si Claude falla, devolver el HTML original sin romper la importación
    return html;
  }
}

export async function POST(request: Request) {
  try {
    const { wpUrl, storeId, selectedIds, overwrite } = await request.json();

    if (!wpUrl || !storeId || !selectedIds?.length) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros: wpUrl, storeId, selectedIds',
      }, { status: 400 });
    }

    const { data: tienda } = await supabase
      .from('tiendas')
      .select('access_token, blog_id')
      .eq('store_id', storeId)
      .single();

    if (!tienda?.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Token de acceso no encontrado. Reinstalá la app.',
      }, { status: 401 });
    }

    if (!tienda.blog_id) {
      return NextResponse.json({
        success: false,
        error: 'Blog no configurado. Creá un blog desde el admin de Tiendanube primero.',
      }, { status: 400 });
    }

    const cleanUrl = wpUrl.replace(/\/$/, '');
    const blogApiBase = `https://api.tiendanube.com/2025-03/${storeId}/blogs/${tienda.blog_id}`;
    const headers: Record<string, string> = {
      Authentication: `bearer ${tienda.access_token}`,
      'User-Agent': 'WP-Importer (den@tiendanube.com)',
    };

    const wpRes = await fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=100`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WP-Importer/1.0)',
        Accept: 'application/json',
      },
    });

    if (!wpRes.ok) {
      return NextResponse.json({
        success: false,
        error: `Error obteniendo posts de WordPress: HTTP ${wpRes.status}`,
      }, { status: 400 });
    }

    const wpPosts = await wpRes.json();
    const selectedPosts = wpPosts.filter((p: any) => selectedIds.includes(p.id));

    if (selectedPosts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron los posts seleccionados en WordPress.',
      }, { status: 400 });
    }

    let existingHandles: Record<string, string> = {};
    if (overwrite) {
      try {
        const existingRes = await fetch(`${blogApiBase}/posts?page=1`, { headers });
        if (existingRes.ok) {
          const existingData = await existingRes.json();
          const posts = existingData?.posts?.data || [];
          for (const post of posts) {
            const handle = post.data?.[0]?.handle;
            if (handle) existingHandles[handle] = post.post_id;
          }
        }
      } catch { }
    }

    const processed: Array<{
      wpId: number;
      title: string;
      success: boolean;
      overwritten: boolean;
      error?: string;
    }> = [];

    for (const post of selectedPosts) {
      const title = post.title?.rendered?.replace(/<[^>]*>/g, '') || 'Sin título';
      const rawContent = post.content?.rendered || '';
      const excerpt = (post.excerpt?.rendered || '').replace(/<[^>]*>/g, '').trim();
      const slug = post.slug || '';

      const decodedTitle = title
        .replace(/&#8217;/g, "'").replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&hellip;/g, '...').replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));

      const decodedExcerpt = excerpt
        .replace(/&#8217;/g, "'").replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&hellip;/g, '...').replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));

      try {
        // ─── Limpiar HTML con Claude ───
        const cleanedContent = await cleanHtmlWithClaude(rawContent);

        let isOverwrite = false;
        let method = 'POST';
        let url = `${blogApiBase}/posts`;

        if (overwrite && existingHandles[slug]) {
          method = 'PUT';
          url = `${blogApiBase}/posts/${existingHandles[slug]}`;
          isOverwrite = true;
        }

        const yoast = post.yoast_head_json;
        const seoTitle = yoast?.title || yoast?.og_title || decodedTitle;
        const seoDescription = yoast?.description || yoast?.og_description || decodedExcerpt.substring(0, 160);
        const seoHandle = yoast?.og_url?.split('/').filter(Boolean).pop() || slug;

        const metadata = JSON.stringify({
          language: 'es',
          title: decodedTitle,
          handle: seoHandle,
          summary: decodedExcerpt.substring(0, 300),
          seo_title: seoTitle,
          seo_description: seoDescription,
        });

        const formData = new FormData();
        formData.append('metadata', metadata);
        formData.append('content', cleanedContent);
        formData.append('published', 'true');

        if (post.featured_media && post.featured_media > 0) {
          try {
            const mediaRes = await fetch(
              `${cleanUrl}/wp-json/wp/v2/media/${post.featured_media}`,
              { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WP-Importer/1.0)', Accept: 'application/json' } }
            );
            if (mediaRes.ok) {
              const media = await mediaRes.json();
              const imageUrl = media.source_url || media.guid?.rendered;
              if (imageUrl) formData.append('thumbnail', imageUrl);
            }
          } catch { }
        }

        const res = await fetch(url, { method, headers, body: formData });

        if (method === 'PUT' && res.status === 204) {
          processed.push({ wpId: post.id, title: decodedTitle, success: true, overwritten: true });
        } else if (method === 'POST' && (res.status === 200 || res.status === 201)) {
          processed.push({ wpId: post.id, title: decodedTitle, success: true, overwritten: false });
        } else {
          const errorText = await res.text();
          console.error(`Error importing "${decodedTitle}": ${res.status} - ${errorText}`);
          processed.push({ wpId: post.id, title: decodedTitle, success: false, overwritten: false, error: `HTTP ${res.status}: ${errorText.substring(0, 200)}` });
        }
      } catch (err: any) {
        console.error(`Exception importing "${decodedTitle}":`, err);
        processed.push({ wpId: post.id, title: decodedTitle, success: false, overwritten: false, error: err.message });
      }
    }

    try {
      await supabase.from('import_history').insert({
        store_id: storeId,
        source_url: cleanUrl,
        total_posts: processed.length,
        successful: processed.filter((p) => p.success).length,
        failed: processed.filter((p) => !p.success).length,
        details: processed,
      });
    } catch { }

    return NextResponse.json({ success: true, processed });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error inesperado en la importación',
    }, { status: 500 });
  }
}
