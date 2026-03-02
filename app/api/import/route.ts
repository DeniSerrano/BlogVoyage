import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { wpUrl, storeId, selectedIds, overwrite } = await request.json();

    if (!wpUrl || !storeId || !selectedIds?.length) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros: wpUrl, storeId, selectedIds',
      }, { status: 400 });
    }

    // Get access token and blog_id from Supabase
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

    // Fetch WordPress posts
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

    // Filter selected posts
    const selectedPosts = wpPosts.filter((p: any) => selectedIds.includes(p.id));

    if (selectedPosts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron los posts seleccionados en WordPress.',
      }, { status: 400 });
    }

    // Get existing blog posts to check duplicates (if overwrite is relevant)
    let existingHandles: Record<string, string> = {};
    if (overwrite) {
      try {
        const existingRes = await fetch(`${blogApiBase}/posts?page=1`, { headers });
        if (existingRes.ok) {
          const existingData = await existingRes.json();
          const posts = existingData?.posts?.data || [];
          for (const post of posts) {
            const handle = post.data?.[0]?.handle;
            if (handle) {
              existingHandles[handle] = post.post_id;
            }
          }
        }
      } catch {
        // Ignore errors checking existing posts
      }
    }

    // Import each selected post
    const processed: Array<{
      wpId: number;
      title: string;
      success: boolean;
      overwritten: boolean;
      error?: string;
    }> = [];

    for (const post of selectedPosts) {
      const title = post.title?.rendered?.replace(/<[^>]*>/g, '') || 'Sin título';
      const content = post.content?.rendered || '';
      const excerpt = (post.excerpt?.rendered || '').replace(/<[^>]*>/g, '').trim();
      const slug = post.slug || '';

      // Decode HTML entities in title
      const decodedTitle = title
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&hellip;/g, '...')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));

      const decodedExcerpt = excerpt
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&hellip;/g, '...')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));

      try {
        let isOverwrite = false;
        let method = 'POST';
        let url = `${blogApiBase}/posts`;

        // Check if we should overwrite
        if (overwrite && existingHandles[slug]) {
          method = 'PUT';
          url = `${blogApiBase}/posts/${existingHandles[slug]}`;
          isOverwrite = true;
        }

        // Blog API uses multipart/form-data
        const metadata = JSON.stringify({
          language: 'es',
          title: decodedTitle,
          handle: slug,
          summary: decodedExcerpt.substring(0, 300),
          seo_title: decodedTitle,
          seo_description: decodedExcerpt.substring(0, 160),
        });

        const formData = new FormData();
        formData.append('metadata', metadata);
        formData.append('content', content);
        formData.append('published', 'true');

        // Get featured image if available
        if (post.featured_media && post.featured_media > 0) {
          try {
            const mediaRes = await fetch(
              `${cleanUrl}/wp-json/wp/v2/media/${post.featured_media}`,
              {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; WP-Importer/1.0)',
                  Accept: 'application/json',
                },
              }
            );
            if (mediaRes.ok) {
              const media = await mediaRes.json();
              const imageUrl = media.source_url || media.guid?.rendered;
              if (imageUrl) {
                formData.append('thumbnail', imageUrl);
              }
            }
          } catch {
            // Skip thumbnail if we can't get it
          }
        }

        const res = await fetch(url, {
          method,
          headers: {
            ...headers,
            // Don't set Content-Type - fetch sets it automatically for FormData with boundary
          },
          body: formData,
        });

        if (method === 'PUT' && res.status === 204) {
          processed.push({ wpId: post.id, title: decodedTitle, success: true, overwritten: true });
        } else if (method === 'POST' && (res.status === 200 || res.status === 201)) {
          processed.push({ wpId: post.id, title: decodedTitle, success: true, overwritten: false });
        } else {
          const errorText = await res.text();
          console.error(`Error importing "${decodedTitle}": ${res.status} - ${errorText}`);
          processed.push({
            wpId: post.id,
            title: decodedTitle,
            success: false,
            overwritten: false,
            error: `HTTP ${res.status}: ${errorText.substring(0, 200)}`,
          });
        }
      } catch (err: any) {
        console.error(`Exception importing "${decodedTitle}":`, err);
        processed.push({
          wpId: post.id,
          title: decodedTitle,
          success: false,
          overwritten: false,
          error: err.message,
        });
      }
    }

    // Save to import history
    try {
      await supabase.from('import_history').insert({
        store_id: storeId,
        source_url: cleanUrl,
        total_posts: processed.length,
        successful: processed.filter((p) => p.success).length,
        failed: processed.filter((p) => !p.success).length,
        details: processed,
      });
    } catch {
      // Don't fail the import if history save fails
    }

    return NextResponse.json({ success: true, processed });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error inesperado en la importación',
    }, { status: 500 });
  }
}
