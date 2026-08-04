import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data: coupons, error } = await supabase
      .from('pos_loyalty_coupons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error('Error fetching active coupons:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
