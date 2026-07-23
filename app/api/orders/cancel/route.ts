import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role to update order status bypassing RLS

export async function POST(req: Request) {
  try {
    const { id, reason } = await req.json();

    if (!id || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify the order exists and is still in 'pending' status
    const { data: order, error: fetchError } = await supabase
      .from('pos_orders')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'pending' && order.status !== 'payment_pending') {
      return NextResponse.json({ 
        error: 'Cannot cancel order', 
        message: 'ออเดอร์นี้ไม่สามารถยกเลิกได้ เนื่องจากพนักงานหรือครัวได้รับออเดอร์แล้ว'
      }, { status: 403 });
    }

    // 2. Update status to 'cancelled' and set the void_reason
    const { error: updateError } = await supabase
      .from('pos_orders')
      .update({ 
        status: 'cancelled',
        void_reason: `[ลูกค้ายกเลิก]: ${reason}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error cancelling order:', updateError);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error in cancel order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
