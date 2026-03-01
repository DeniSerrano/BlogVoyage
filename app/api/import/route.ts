import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  const { wpUrl, storeId } = await request.json();

  // 1. Buscar el token de esta tienda en nuestra base de datos (Supabase)
  const { data: tienda } = await supabase
    .from('tiendas')
    .select('access_token')
    .eq('store_id', storeId)
    .single();

  if (!tienda) return NextResponse.json({ error: 'Tienda no vinculada' }, { status: 400 });

  try {
    // 2. Traer productos de WordPress (usando su API pública)
    const wpRes = await fetch(`${wpUrl}/wp-json/wp/v2/product?per_page=10`);
    const products = await wpRes.json();

    // 3. Subir cada producto a Tiendanube
    for (const prod of products) {
      await fetch(`https://api.tiendanube.com/v1/${storeId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication': `bearer ${tienda.access_token}`
        },
        body: JSON.stringify({
          name: { es: prod.title.rendered },
          description: { es: prod.content.rendered },
          images: prod.featured_media ? [{ src: prod.featured_media_url }] : []
        })
      });
    }

    return NextResponse.json({ message: `Importación de ${products.length} productos completada` });
  } catch (error) {
    return NextResponse.json({ error: 'Error al importar' }, { status: 500 });
  }
}