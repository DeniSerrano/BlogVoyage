import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { storeId, slugs } = await request.json();

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Falta store_id' }, { status: 400 });
    }

    const { data: tienda } = await supabase
      .from('tiendas')
      .select('access_token')
      .eq('store_id', storeId)
      .single();

    if (!tienda?.access_token) {
      return NextResponse.json({ success: false, error: 'Tienda no autenticada' }, { status: 401 });
    }

    // Obtener todas las páginas existentes en la tienda
    const tnRes = await fetch(`https://api.tiendanube.com/2025-03/${storeId}/pages`, {
      headers: {
        'Authentication': `bearer ${tienda.access_token}`,
        'User-Agent': 'WP-Importer (admin@example.com)',
      },
    });

    if (!tnRes.ok) {
      return NextResponse.json({ success: false, error: 'Error consultando páginas existentes' }, { status: 500 });
    }

    const data = await tnRes.json();
    const existingPages = data?.pages?.results || [];

    // Extraer handles existentes
    const existingHandles = new Set<string>();
    for (const page of existingPages) {
      if (page.handle) {
        for (const lang of Object.keys(page.handle)) {
          existingHandles.add(page.handle[lang]);
        }
      }
    }

    // Comparar slugs contra handles existentes
    const duplicates: Record<string, boolean> = {};
    for (const slug of slugs) {
      duplicates[slug] = existingHandles.has(slug);
    }

    return NextResponse.json({ success: true, duplicates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
