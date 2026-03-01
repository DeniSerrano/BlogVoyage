import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { wpUrl, accessToken, storeId } = await request.json();

  try {
    // 1. Obtener posts de WordPress (usamos _embed para traer las imágenes)
    const wpResponse = await fetch(`${wpUrl}/wp-json/wp/v2/posts?_embed&per_page=10`);
    const posts = await wpResponse.json();

    const results = [];

    // 2. Iterar y subir a Tiendanube
    for (const post of posts) {
      // Extraer imagen destacada si existe
      const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
      
      // Preparar el cuerpo con la imagen inyectada al principio del contenido
      const pageData = {
        name: { es: post.title.rendered },
        content: { 
          es: featuredImage 
            ? `<img src="${featuredImage}" style="max-width:100%;"><br/>${post.content.rendered}` 
            : post.content.rendered 
        },
        published: true,
        handle: { es: post.slug }
      };

      // 3. POST a la API de Tiendanube
      const tnuResponse = await fetch(`https://api.tiendanube.com/v1/${storeId}/pages`, {
        method: 'POST',
        headers: {
          'Authentication': `bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'WP-Importer (tu-email@dominio.com)' // Tiendanube pide un User-Agent identificable
        },
        body: JSON.stringify(pageData)
      });

      const result = await tnuResponse.json();
      results.push({ title: post.title.rendered, status: tnuResponse.ok });
    }

    return NextResponse.json({ message: 'Proceso completado', detail: results });

  } catch (error) {
    return NextResponse.json({ error: 'Fallo la importación', details: error }, { status: 500 });
  }
}
