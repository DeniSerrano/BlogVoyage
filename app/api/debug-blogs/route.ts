import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('store_id');
  const action = searchParams.get('action') || 'list';

  if (!storeId) {
    return NextResponse.json({ success: false, error: 'store_id requerido' }, { status: 400 });
  }

  const { data: tienda } = await supabase
    .from('tiendas')
    .select('access_token')
    .eq('store_id', storeId)
    .single();

  if (!tienda?.access_token) {
    return NextResponse.json({ success: false, error: 'Token no encontrado' }, { status: 401 });
  }

  const baseUrl = `https://api.tiendanube.com/2025-03/${storeId}`;
  const headers: Record<string, string> = {
    Authentication: `bearer ${tienda.access_token}`,
    'User-Agent': 'WP-Importer (den@tiendanube.com)',
  };

  try {
    if (action === 'create') {
      const res = await fetch(`${baseUrl}/blogs`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Blog' }),
      });
      const text = await res.text();
      return NextResponse.json({ action: 'create', status: res.status, body: text });
    }

    if (action === 'store') {
      const res = await fetch(`${baseUrl}/store`, { headers });
      const text = await res.text();
      return NextResponse.json({ action: 'store', status: res.status, body: text.substring(0, 3000) });
    }

    // Default: try multiple blog-related URLs
    const results: any[] = [];
    const urls = ['/blogs', '/blog', '/blogs/posts', '/blog/posts'];

    for (const path of urls) {
      const res = await fetch(`${baseUrl}${path}`, { headers });
      const text = await res.text();
      results.push({ path, status: res.status, body: text.substring(0, 500) });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
