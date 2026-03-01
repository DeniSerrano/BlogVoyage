import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  // Obtenemos las variables y les quitamos espacios invisibles por seguridad
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
      // ÉXITO: El token es válido, volvemos a la pantalla principal de la app
      return NextResponse.redirect(new URL('/', request.url));
    } else {
      // ERROR: Tiendanube rechazó las credenciales
      return NextResponse.json({ 
        error: 'Credenciales inválidas en Vercel', 
        detalles: data 
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error de conexión con Tiendanube' }, { status: 500 });
  }
}
