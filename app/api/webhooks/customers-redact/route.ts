import { NextResponse } from 'next/server';

export async function POST() {
  // BlogVoyage no almacena datos de clientes finales
  return NextResponse.json({ success: true });
}