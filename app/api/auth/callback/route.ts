import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Si no hay código, es un acceso inválido
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  const clientId = process.env.TIENDANUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.TIENDANUBE_CLIENT_SECRET?.trim();

  try {
    // 1. Intercambiamos el código por el Token
    const response = await fetch('https://www.tiendanube.com/apps/authorize/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code.trim(),
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      // 2. ¡ÉXITO! Ahora, en lugar de una pantalla negra, 
      // redirigimos al "Show" de la App dentro del Admin.
      // Esto fuerza a Tiendanube a cargar tu index (page.tsx) dentro de su marco.
      return NextResponse.redirect(`https://admin.tiendanube.com/admin/apps/${clientId}/show`);
    } else {
      return NextResponse.json({ error: 'Token exchange failed', details: data }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
