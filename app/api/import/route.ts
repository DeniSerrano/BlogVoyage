import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { wpUrl } = await request.json();
    const cleanUrl = wpUrl.replace(/\/$/, "");
    
    const wpRes = await fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=10`);
    if (!wpRes.ok) throw new Error('WordPress no respondió correctamente.');
    const posts = await wpRes.json();
    
    const results = [];

    for (const post of posts) {
      // Creamos un "handle" (slug) limpio a partir del título
      const slug = post.title.rendered
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const tnRes = await fetch(`https://api.tiendanube.com/v1/${process.env.TIENDANUBE_USER_ID}/pages`, {
        method: 'POST',
        headers: {
          'Authentication': `bearer ${process.env.TIENDANUBE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'WP-Importer (admin@example.com)'
        },
        body: JSON.stringify({
          handle: { es: slug },
          name: { es: post.title.rendered },
          content: { es: post.content.rendered },
          published: true
        })
      });

      const responseData = await tnRes.json();

      if (!tnRes.ok) {
        console.error(`Fallo en Tiendanube:`, responseData);
      }

      results.push({
        title: post.title.rendered,
        success: tnRes.ok
      });
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (error: any) {
    console.error('Error Crítico:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
