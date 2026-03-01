import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // 1. Verificación básica del código
    if (!code) {
        return NextResponse.json({ error: 'No code found' }, { status: 400 });
    }

    const clientId = process.env.TIENDANUBE_CLIENT_ID?.trim();
    const clientSecret = process.env.TIENDANUBE_CLIENT_SECRET?.trim();

    try {
        // 2. Intercambio del código por el Access Token
        const response = await fetch('https://www.tiendanube.com/apps/authorize/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WP-Migration-Maker (tu-email@ejemplo.com)' // OBLIGATORIO para Tiendanube
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                code: code.trim(),
            }),
        });

        const data = await response.json();

        // 3. Manejo de la respuesta
        if (data.access_token) {
            console.log('Token obtenido con éxito:', data.user_id);
            
            // Aquí deberías guardar el data.access_token y data.user_id en tu base de datos
            
            // Redirigimos al Home de tu app una vez autenticado
            return NextResponse.redirect(new URL('/', request.url));
        } else {
            // Si Tiendanube devuelve error (como invalid_client)
            return NextResponse.json({ 
                error: 'Tiendanube Auth Failed', 
                details: data 
            }, { status: 401 });
        }

    } catch (error) {
        console.error('Error en el proceso de callback:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
