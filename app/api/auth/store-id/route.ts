import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get the most recently authenticated store
    const { data, error } = await supabase
      .from('tiendas')
      .select('store_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ storeId: null });
    }

    return NextResponse.json({ storeId: data.store_id });
  } catch {
    return NextResponse.json({ storeId: null });
  }
}
