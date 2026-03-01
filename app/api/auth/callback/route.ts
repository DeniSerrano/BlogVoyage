import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 });

  const clientId = process.env.TIENDANUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.TIENDANUBE_CLIENT_SECRET?.trim();

  try {
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
      // 1. Obtenemos el ID de la tienda que nos envió Tiendanube
      const user_id = data.user_id; 
      
      // 2. Redirigimos directamente al Administrador de Tiendanube, a la sección de tu App
      // Esto hace que la pantalla negra desaparezca y vuelvas al panel azul
      return NextResponse.redirect(`https://admin.tiendanube.com/apps/${clientId}/install?shop=${user_id}`);
    } else {
      return NextResponse.json({ error: 'Credenciales inválidas', detalles: data }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error de red' }, { status: 500 });
  }
}
