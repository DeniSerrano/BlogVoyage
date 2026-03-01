import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  // Por ahora, solo vamos a mostrar que recibimos el código
  // para que no te tire el error 404.
  return NextResponse.json({
    message: "¡Conexión exitosa!",
    code: code,
    instruccion: "Ahora ya podemos usar este código para pedir el Token definitivo."
  });
}