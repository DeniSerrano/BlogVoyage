import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('store_id');

  if (!storeId) {
    return NextResponse.json({ success: false, error: 'store_id requerido' }, { status: 400 });
  }

  // Get access token from Supabase
  const { data: tienda } = await supabase
    .from('tiendas')
    .select('access_token')
    .eq('store_id', storeId)
    .single();

  if (!tienda?.access_token) {
    return NextResponse.json({ success: false, error: 'Token no encontrado' }, { status: 401 });
  }

  try {
    // Try to list blogs
    const blogsRes = await fetch(
      `https://api.tiendanube.com/2025-03/${storeId}/blogs`,
      {
        headers: {
          Authentication: `bearer ${tienda.access_token}`,
          'User-Agent': 'WP-Importer (den@tiendanube.com)',
        },
      }
    );

    const blogsText = await blogsRes.text();
    
    return NextResponse.json({
      success: true,
      status: blogsRes.status,
      headers: Object.fromEntries(blogsRes.headers.entries()),
      body: blogsText.substring(0, 2000),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
