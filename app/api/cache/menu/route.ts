import { NextResponse } from 'next/server';
import { redis, CACHE_TTL } from '@/lib/redis';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || 'main';
    const cacheKey = `cache:menu:${branchId}`;

    // 1. Try to fetch from Redis Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({ 
        source: 'redis', 
        data: cachedData 
      });
    }

    // 2. Cache Miss: Fetch from Supabase
    let catQuery = supabase.from('pos_menu_categories').select('*').order('order_index');
    let itemQuery = supabase
      .from('pos_menu_items')
      .select('*, modifiers:pos_item_modifier_links(group_id)')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (branchId !== 'main') {
      catQuery = catQuery.or(`branch_id.eq.${branchId},branch_id.is.null`);
      itemQuery = itemQuery.or(`branch_id.eq.${branchId},branch_id.is.null`);
    } else {
      catQuery = catQuery.is('branch_id', null);
      itemQuery = itemQuery.is('branch_id', null);
    }

    const [catResponse, itemResponse] = await Promise.all([catQuery, itemQuery]);

    if (catResponse.error) throw catResponse.error;
    if (itemResponse.error) throw itemResponse.error;

    const payload = {
      categories: catResponse.data,
      items: itemResponse.data,
      cachedAt: new Date().toISOString()
    };

    // 3. Store in Redis
    await redis.set(cacheKey, payload, { ex: CACHE_TTL.MENU });

    return NextResponse.json({ 
      source: 'database', 
      data: payload 
    });

  } catch (error: any) {
    console.error('Redis Menu Cache API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
