import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('line_user_id');

    if (!lineUserId) {
      return NextResponse.json({ error: 'Missing line_user_id' }, { status: 400 });
    }

    // 1. Get recent orders by this user
    const { data: orders, error: ordersError } = await supabase
      .from('pos_orders')
      .select('id')
      .eq('line_user_id', lineUserId)
      .order('created_at', { ascending: false })
      .limit(50); // Look at last 50 orders

    if (ordersError || !orders || orders.length === 0) {
      return NextResponse.json({ regulars: [] });
    }

    const orderIds = orders.map((o) => o.id);

    // 2. Get items from these orders
    const { data: items, error: itemsError } = await supabase
      .from('pos_order_items')
      .select('item_id')
      .in('order_id', orderIds);

    if (itemsError || !items) {
      return NextResponse.json({ regulars: [] });
    }

    // 3. Calculate frequency
    const frequency: Record<string, number> = {};
    for (const item of items) {
      if (item.item_id) {
        frequency[item.item_id] = (frequency[item.item_id] || 0) + 1;
      }
    }

    // 4. Sort and get top 4
    const topItems = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1]) // sort descending
      .slice(0, 4)
      .map((entry) => entry[0]);

    return NextResponse.json({ regulars: topItems });
  } catch (error: any) {
    console.error('Error fetching regular items:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
