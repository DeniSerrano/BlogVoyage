import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('store_id');
  if (!storeId) return NextResponse.json({ success: false, error: 'store_id requerido' }, { status: 400 });

  const { data } = await supabase
    .from('tiendas')
    .select('wp_url, autosync_enabled, autosync_publish, autosync_last_synced_at')
    .eq('store_id', storeId)
    .single();

  return NextResponse.json({
    success: true,
    wp_url: data?.wp_url || '',
    autosync_enabled: data?.autosync_enabled || false,
    autosync_publish: data?.autosync_publish || false,
    autosync_last_synced_at: data?.autosync_last_synced_at || null,
  });
}

export async function POST(request: Request) {
  const { storeId, wpUrl, autosync_enabled, autosync_publish } = await request.json();
  if (!storeId) return NextResponse.json({ success: false, error: 'storeId requerido' }, { status: 400 });

  const updateData: any = {};
  if (wpUrl !== undefined) updateData.wp_url = wpUrl;
  if (autosync_enabled !== undefined) updateData.autosync_enabled = autosync_enabled;
  if (autosync_publish !== undefined) updateData.autosync_publish = autosync_publish;

  const { error } = await supabase.from('tiendas').update(updateData).eq('store_id', storeId);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}