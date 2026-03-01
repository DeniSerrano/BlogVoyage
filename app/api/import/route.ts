import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { wpUrl } = await request.json();
    const cleanUrl = wpUrl.replace(/\/$/, "");
    
    // 1. Obtener posts de WordPress
    const wpRes = await fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=10`);
    if (!wpRes.ok) throw new Error('No se pudo conectar con WordPress');
    const posts = await wpRes.json();
    
    const results = [];

    // 2. Intentar crear en Tiendanube
    for (const post of posts) {
      const tnRes = await fetch(`https://api.tiendanube.com/v1/${process.env.TIENDANUBE_USER_ID}/pages`, {
        method: 'POST',
        headers: {
          // IMPORTANTE: Asegurate que el Bearer esté bien escrito
          'Authentication': `bearer ${process.env.TIENDANUBE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Tiendanube WP Importer (admin@example.com)'
        },
        body: JSON.stringify({
          name: { es: post.title.rendered },
          content: { es: post.content.rendered }
        })
      });

      // Si falla, registramos el error en los logs de Vercel
      if (!tnRes.ok) {
        const errorData = await tnRes.json();
        console.error(`Error en Tiendanube para "${post.title.rendered}":`, errorData);
      }

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
