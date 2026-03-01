import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { wpUrl } = await request.json();
  
  // Limpiamos la URL por si viene con barra al final
  const cleanWpUrl = wpUrl.replace(/\/$/, "");

  try {
    // 1. Buscamos los últimos 5 posts del WordPress
    const wpRes = await fetch(`${cleanWpUrl}/wp-json/wp/v2/posts?_embed&per_page=5`);
    
    if (!wpRes.ok) throw new Error('No se pudo conectar con WordPress');
    
    const posts = await wpRes.json();
    const results = [];

    // 2. Iteramos y enviamos a Tiendanube
    for (const post of posts) {
      const tnRes = await fetch(`https://api.tiendanube.com/v1/${process.env.TIENDANUBE_USER_ID}/pages`, {
        method: 'POST',
        headers: {
          'Authentication': `bearer ${process.env.TIENDANUBE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'WP-Importer-App (nube@example.com)'
        },
        body: JSON.stringify({
          name: { es: post.title.rendered },
          content: { es: post.content.rendered }
        })
      });
      
      results.push({ 
        title: post.title.rendered, 
        status: tnRes.ok ? 'success' : 'error' 
      });
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
