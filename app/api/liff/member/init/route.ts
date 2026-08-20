import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const createSupabaseServiceClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const { lineUserId, displayName, avatarUrl, branchId } = body

        const supabase = createSupabaseServiceClient()

        // Get merchant_id from branchId
        let merchantId = '00000000-0000-0000-0000-000000000000';
        if (branchId) {
          const { data: branchData } = await supabase
            .from('branches')
            .select('merchant_id')
            .eq('id', branchId)
            .maybeSingle();
          if (branchData?.merchant_id) {
            merchantId = branchData.merchant_id;
          }
        }

        // 1. Prepare parallel queries for BOTH public and user data
        const fetchBanners = supabase.from('pos_banners').select('*').eq('is_active', true).order('order_index').limit(5);
        const fetchSettings = branchId
          ? supabase.from('pos_shop_settings').select('*').eq('branch_id', branchId).maybeSingle()
          : supabase.from('pos_shop_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
        
        let fetchMenuCache;
        try {
          fetchMenuCache = redis.get(`cache:menu:${merchantId}`);
        } catch (e) {
          fetchMenuCache = Promise.resolve(null);
        }

        // User-specific queries (conditional)
        const fetchMember = lineUserId
          ? supabase.from('pos_members').select('*').eq('line_user_id', lineUserId).eq('merchant_id', merchantId).maybeSingle()
          : Promise.resolve({ data: null, error: null });

        const fetchOrders = lineUserId
          ? supabase.from('pos_orders').select('*').eq('line_user_id', lineUserId).eq('merchant_id', merchantId).in('status', ['pending', 'payment_pending', 'paid', 'accepted', 'preparing', 'shipping', 'out_for_delivery']).order('created_at', { ascending: false }).limit(3)
          : Promise.resolve({ data: [], error: null });

        const fetchLastAddress = lineUserId
          ? supabase.from('pos_orders').select('delivery_address').eq('line_user_id', lineUserId).eq('merchant_id', merchantId).not('delivery_address', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle()
          : Promise.resolve({ data: null, error: null });

        // Run ALL select queries in parallel (1 single server roundtrip to Supabase!)
        const [bannersRes, settingsRes, menuCacheData, memberRes, ordersRes, lastAddressRes] = await Promise.all([
          fetchBanners,
          settingsRes,
          fetchMenuCache,
          fetchMember,
          fetchOrders,
          fetchLastAddress
        ]);

        // Process menu cache fallbacks if Redis misses or fails
        let finalMenu = menuCacheData;
        if (!finalMenu) {
          const [catRes, itemRes] = await Promise.all([
            supabase.from('pos_menu_categories').select('*').eq('merchant_id', merchantId).order('order_index'),
            supabase.from('pos_menu_items').select('*, modifiers:pos_item_modifier_links(group_id)').eq('is_active', true).eq('merchant_id', merchantId).order('name', { ascending: true })
          ]);
          if (!catRes.error && !itemRes.error) {
            finalMenu = {
              categories: catRes.data,
              items: itemRes.data,
              cachedAt: new Date().toISOString()
            };
            try {
              await redis.set(`cache:menu:${merchantId}`, finalMenu, { ex: 300 }); // 5 minutes cache
            } catch (e) {}
          }
        }

        // Process member lookup / insertion
        let member = memberRes.data;
        let isNew = false;

        if (lineUserId && !member) {
            // Write query (only happens once on first-time registration)
            const { data: newMember, error: insertError } = await supabase.from('pos_members').insert({
                line_user_id: lineUserId,
                display_name: displayName || '',
                avatar_url: avatarUrl || '',
                points: 0,
                total_accumulated_points: 0,
                merchant_id: merchantId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).select().single()

            if (!insertError && newMember) {
                member = newMember;
                isNew = true;
            }
        } else if (member) {
            // Update profile if they scan but details were empty
            if (!member.display_name || !member.avatar_url) {
                const { data: updated } = await supabase.from('pos_members').update({
                    display_name: member.display_name || displayName,
                    avatar_url: member.avatar_url || avatarUrl,
                    updated_at: new Date().toISOString()
                }).eq('id', member.id).select().single()
                if (updated) member = updated;
            }
        }

        return NextResponse.json({
            success: true,
            member,
            isNew,
            banners: bannersRes.data || [],
            shopStatus: settingsRes || null,
            activeOrders: ordersRes.data || [],
            menu: finalMenu,
            lastDeliveryAddress: lastAddressRes.data?.delivery_address || null
        });

    } catch (error) {
        console.error('POST /api/liff/member/init error', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
