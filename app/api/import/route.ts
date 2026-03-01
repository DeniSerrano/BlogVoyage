import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { wpUrl } = await request.json();
    const cleanUrl = wpUrl.replace(/\/$/, '');

    const wpRes = await fetch(`${cleanUrl}/wp-json/wp/v2/posts?per_page=20`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WP-Importer/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!wpRes.ok) {
      const status = wpRes.status;
      if (status === 404) {
        return NextResponse.json({
          success: false,
          error: `No se encontró la API REST de WordPress en ${cleanUrl}. Verificá que sea un sitio WordPress con la API habilitada.`,
        }, { status: 400 });
      }
      if (status === 403) {
        return NextResponse.json({
          success: false,
          error: `El sitio bloqueó el acceso a la API REST (403 Forbidden). Puede tener protección anti-bot.`,
        }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        error: `WordPress respondió con error HTTP ${status}.`,
      }, { status: 400 });
    }

    const contentType = wpRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
      return NextResponse.json({
        success: false,
        error: `El sitio no devolvió JSON. Posiblemente no es WordPress o la API REST está deshabilitada.`,
      }, { status: 400 });
    }

    const text = await wpRes.text();
    let posts;
    try {
      posts = JSON.parse(text);
    } catch {
      return NextResponse.json({
        success: false,
        error: `No se pudo parsear la respuesta de WordPress. Respuesta inválida.`,
      }, { status: 400 });
    }

    if (!Array.isArray(posts)) {
      return NextResponse.json({
        success: false,
        error: `La respuesta de WordPress no es una lista de posts.`,
      }, { status: 400 });
    }

    const previews = posts.map((post: any) => ({
      wpId: post.id,
      title: post.title?.rendered || 'Sin título',
      excerpt: (post.excerpt?.rendered || '').replace(/<[^>]*>/g, '').substring(0, 150),
      date: post.date,
      slug: post.slug,
      link: post.link,
    }));

    return NextResponse.json({ success: true, posts: previews });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Error inesperado al conectar con WordPress',
    }, { status: 500 });
  }
}
