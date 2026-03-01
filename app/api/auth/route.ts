import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.TIENDANUBE_CLIENT_ID;
  const authUrl = `https://www.tiendanube.com/apps/${clientId}/authorize`;
  return NextResponse.redirect(authUrl);
}
