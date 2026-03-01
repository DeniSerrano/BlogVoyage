import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { wpUrl } = await request.json();
    if (!wpUrl) return NextResponse.json({ error: 'Falta la URL' }, { status: 400 });

    // Limpieza de URL
    const cleanUrl = wpUrl.replace(/\/$/, "");
    
    // 1. Obtener posts de WordPress (intentamos traer los últimos 10)
    const wpRes = await fetch(`${cleanUrl}/wp-json/wp/v2/posts?_embed&per_page=10`);
    
    if (!wpRes.ok) {
      throw new Error('No se pudo acceder a los posts. Asegúrate de que el sitio sea WordPress y tenga la REST API activa.');
    }
    
    const posts = await wpRes.json();
    const results = [];

    // 2. Crear páginas en Tiendanube
    // Usamos las variables que ya tenés configuradas en Vercel
    for (const post of posts) {
      const tnRes = await fetch(`https://api.tiendanube.com/v1/${process.env.TIENDANUBE_USER_ID}/pages`, {
        method: 'POST',
        headers: {
          'Authentication': `bearer ${process.env.TIENDANUBE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'WP-Importer-App (admin@example.com)'
        },
        body: JSON.stringify({
          name: { es: post.title.rendered },
          content: { es: post.content.rendered },
          published: true
        })
      });

      results.push({
        title: post.title.rendered,
        success: tnRes.ok
      });
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
