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
      // ESTA ES LA CLAVE: Redirigimos al Home de Vercel. 
      // Tiendanube se encargará de mantenerlo dentro del panel si la URL de la App está bien.
      return NextResponse.redirect(new URL('/', request.url));
    } else {
      return NextResponse.json({ error: 'Auth failed', details: data }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
