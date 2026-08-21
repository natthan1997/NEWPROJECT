import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; }
        }
      }
    );

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Resolve merchant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('merchant_id')
      .eq('id', user.id)
      .maybeSingle();

    const merchantId = profile?.merchant_id;
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Merchant ID not found' }, { status: 400 });
    }

    // 3. Query all members & orders under this merchant via service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [membersRes, ordersRes] = await Promise.all([
      supabaseAdmin
        .from('pos_members')
        .select('*')
        .eq('merchant_id', merchantId),
      supabaseAdmin
        .from('pos_orders')
        .select(`
          id, 
          member_id, 
          created_at, 
          net_total, 
          status,
          pos_order_items(
            id,
            item_id,
            quantity,
            unit_price,
            selected_modifiers,
            pos_menu_items(name)
          )
        `)
        .eq('merchant_id', merchantId)
        .in('status', ['paid', 'accepted', 'preparing', 'shipping', 'out_for_delivery', 'completed', 'delivered'])
    ]);

    if (membersRes.error) throw membersRes.error;
    if (ordersRes.error) throw ordersRes.error;

    const members = membersRes.data || [];
    const orders = ordersRes.data || [];

    // Group orders by member_id
    const ordersByMember: Record<string, typeof orders> = {};
    orders.forEach(o => {
      if (o.member_id) {
        if (!ordersByMember[o.member_id]) {
          ordersByMember[o.member_id] = [];
        }
        ordersByMember[o.member_id].push(o);
      }
    });

    const now = Date.now();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const DAYS_TH = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

    const segmentedMembers = members.map(m => {
      const memberOrders = ordersByMember[m.id] || [];
      
      // Calculate Recency (R)
      let recency = 999; // Default if no orders
      let lastOrderDate: string | null = null;
      
      if (memberOrders.length > 0) {
        const sortedOrders = [...memberOrders].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        lastOrderDate = sortedOrders[0].created_at;
        const diffMs = now - new Date(lastOrderDate).getTime();
        recency = Math.max(0, Math.floor(diffMs / MS_PER_DAY));
      }

      // Calculate Frequency (F)
      const frequency = memberOrders.length;

      // Calculate Monetary (M)
      const monetary = memberOrders.reduce((sum, o) => sum + Number(o.net_total || 0), 0);

      // Deep Analytics
      const menuCounts: Record<string, number> = {};
      const modifierCounts: Record<string, number> = {};
      const hourCounts: Record<number, number> = {};
      const dayCounts: Record<number, number> = {};

      memberOrders.forEach(o => {
        const date = new Date(o.created_at);
        const hour = date.getHours();
        const day = date.getDay();

        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        dayCounts[day] = (dayCounts[day] || 0) + 1;

        const items = (o as any).pos_order_items || [];
        items.forEach((item: any) => {
          const name = item.pos_menu_items?.name || 'ไม่ระบุชื่อเมนู';
          const qty = Number(item.quantity || 1);
          menuCounts[name] = (menuCounts[name] || 0) + qty;

          // Modifiers
          const modifiers = item.selected_modifiers;
          if (Array.isArray(modifiers)) {
            modifiers.forEach((mod: any) => {
              if (mod.name && mod.value) {
                const label = `${mod.name}: ${mod.value}`;
                modifierCounts[label] = (modifierCounts[label] || 0) + qty;
              }
            });
          }
        });
      });

      // Sort and get Top 3 Menus
      const favoriteMenus = Object.entries(menuCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      // Sort and get Top 3 Options
      const favoriteModifiers = Object.entries(modifierCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      // Sort and get Top 2 Hours
      const favoriteHours = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([h, count]) => ({ hour: `${String(h).padStart(2, '0')}:00 น.`, count }));

      // Sort and get Top 2 Days
      const favoriteDays = Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([d, count]) => ({ dayName: DAYS_TH[Number(d)], count }));

      // Categorize into segments
      let segment: 'loyal' | 'churn' | 'inactive' | 'general' = 'general';

      if (frequency >= 10 || monetary >= 3000) {
        if (recency <= 14) {
          segment = 'loyal';
        } else if (recency <= 30) {
          segment = 'churn';
        } else {
          segment = 'inactive';
        }
      } else {
        if (recency > 30) {
          segment = 'inactive';
        } else if (recency > 14) {
          segment = 'churn';
        } else {
          segment = 'general';
        }
      }

      return {
        id: m.id,
        display_name: m.display_name,
        avatar_url: m.avatar_url,
        line_user_id: m.line_user_id,
        phone: m.phone,
        email: m.email,
        points: m.points,
        created_at: m.created_at,
        rfm: {
          recency,
          frequency,
          monetary,
          lastOrderDate
        },
        analytics: {
          favoriteMenus,
          favoriteModifiers,
          favoriteHours,
          favoriteDays,
        },
        segment
      };
    });

    // Count summaries
    const summary = {
      total: segmentedMembers.length,
      loyal: segmentedMembers.filter(m => m.segment === 'loyal').length,
      churn: segmentedMembers.filter(m => m.segment === 'churn').length,
      inactive: segmentedMembers.filter(m => m.segment === 'inactive').length,
      general: segmentedMembers.filter(m => m.segment === 'general').length,
    };

    return NextResponse.json({
      success: true,
      summary,
      members: segmentedMembers
    });

  } catch (err: any) {
    console.error('Segments API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
