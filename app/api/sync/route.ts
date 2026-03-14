import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncStore(tienda: any) {
  const { store_id, access_token, blog_id, wp_url, autosync_publish, autosync_last_synced_at } = tienda;

  if (!wp_url || !blog_id) return { store_id, skipped: true, reason: 'no wp_url or blog_id' };

  const cleanUrl = wp_url.replace(/\/$/, '');

  const after = autosync_last_synced_at
    ? new Date(autosync_last_synced_at).toISOString()
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const wpRes = await fetch(
    `${cleanUrl}/wp-json/wp/v2/posts?per_page=20&after=${after}&_embed&orderby=date&order=asc`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogVoyage/1.0)', Accept: 'application/json' } }
  );

  if (!wpRes.ok) return { store_id, skipped: true, reason: `WP error ${wpRes.status}` };

  const wpPosts = await wpRes.json();
  if (!Array.isArray(wpPosts) || wpPosts.length === 0) {
    await supabase.from('tiendas').update({ autosync_last_synced_at: new Date().toISOString() }).eq('store_id', store_id);
    return { store_id, imported: 0, failed: 0 };
  }

  const blogApiBase = `https://api.tiendanube.com/2025-03/${store_id}/blogs/${blog_id}`;
  const headers: Record<string, string> = {
    Authentication: `bearer ${access_token}`,
    'User-Agent': 'BlogVoyage (support@blogvoyage.app)',
  };

  let imported = 0;
  let failed = 0;

  for (const post of wpPosts) {
    const title = (post.title?.rendered || 'Sin título').replace(/<[^>]*>/g, '');
    const content = post.content?.rendered || '';
    const excerpt = (post.excerpt?.rendered || '').replace(/<[^>]*>/g, '').trim();
    const slug = post.slug || '';

    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
    const thumbnail =
      featuredMedia?.media_details?.sizes?.medium?.source_url ||
      featuredMedia?.source_url ||
      null;

    const yoast = post.yoast_head_json;
    const metadata = JSON.stringify({
      language: 'es',
      title,
      handle: slug,
      summary: excerpt.substring(0, 300),
      seo_title: yoast?.title || title,
      seo_description: yoast?.description || excerpt.substring(0, 160),
    });

    const formData = new FormData();
    formData.append('metadata', metadata);
    formData.append('content', content);
    formData.append('published', autosync_publish ? 'true' : 'false');
    if (thumbnail) formData.append('thumbnail', thumbnail);

    try {
      const res = await fetch(`${blogApiBase}/posts`, { method: 'POST', headers, body: formData });
      res.status === 200 || res.status === 201 ? imported++ : failed++;
    } catch {
      failed++;
    }
  }

  await supabase.from('tiendas').update({ autosync_last_synced_at: new Date().toISOString() }).eq('store_id', store_id);
  return { store_id, imported, failed };
}

export async function POST(request: Request) {
  try {
    const { storeId } = await request.json();
    if (!storeId) return NextResponse.json({ success: false, error: 'storeId requerido' }, { status: 400 });

    const { data: tienda } = await supabase
      .from('tiendas')
      .select('store_id, access_token, blog_id, wp_url, autosync_publish, autosync_last_synced_at')
      .eq('store_id', storeId)
      .single();

    if (!tienda) return NextResponse.json({ success: false, error: 'Tienda no encontrada' }, { status: 404 });

    const result = await syncStore(tienda);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: tiendas } = await supabase
      .from('tiendas')
      .select('store_id, access_token, blog_id, wp_url, autosync_publish, autosync_last_synced_at')
      .eq('autosync_enabled', true);

    if (!tiendas || tiendas.length === 0) {
      return NextResponse.json({ success: true, message: 'No stores with autosync enabled', results: [] });
    }

    const results = await Promise.allSettled(tiendas.map(syncStore));
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
