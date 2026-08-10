import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { lineUserId, memberId } = await req.json();

    if (!lineUserId && !memberId) {
      return NextResponse.json({ success: false, error: 'Missing lineUserId or memberId' }, { status: 400 });
    }

    let targetMemberId = null;
    if (memberId && memberId.includes('-')) { targetMemberId = memberId; }

    if (!targetMemberId && lineUserId) {
      const { data: profile } = await supabase.from('pos_members').select('id').eq('line_user_id', lineUserId).single();
      if (!profile || !profile.id) {
        return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
      }
      targetMemberId = profile.id;
    }

    // Fetch member's orders
    let orders = [];
    if (targetMemberId) {
      const { data, error } = await supabase
      .from('pos_orders')
      .select('id, net_total, created_at, status')
      .eq('customer_id', targetMemberId)
      .eq('status', 'paid');
      if (error) throw error;
      orders = data || [];
    }

    // Fetch order items with item category info
    const orderIds = orders.map(o => o.id);
    let orderItems: any[] = [];
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('pos_order_items')
        .select('order_id, quantity, menu_item_id, item_name, item:pos_menu_items!item_id(category_id)')
        .in('order_id', orderIds);
      if (items) orderItems = items;
    }

    // Prepare helper structures
    const itemsByOrder = {};
    const itemsByMenuId = {};
    const itemsByCategoryId = {};
    const sameMenuStreakRaw = {};

    for (const item of orderItems) {
      const qty = item.quantity || 1;
      
      // For party buyer
      itemsByOrder[item.order_id] = (itemsByOrder[item.order_id] || 0) + qty;
      
      // For specific menu purchase & same_menu_streak
      if (item.menu_item_id) {
        itemsByMenuId[item.menu_item_id] = (itemsByMenuId[item.menu_item_id] || 0) + qty;
      }
      
      // For fallback same_menu_streak
      const key = item.menu_item_id || item.item_name;
      if (key) {
        sameMenuStreakRaw[key] = (sameMenuStreakRaw[key] || 0) + qty;
      }
      
      // For category purchase
      const catId = item.item?.category_id;
      if (catId) {
        itemsByCategoryId[catId] = (itemsByCategoryId[catId] || 0) + qty;
      }
    }

    // Calculate Behavioral Stats
    const stats = {
      total_visits: orders.length,
      lifetime_spend: orders.reduce((sum, o) => sum + (o.net_total || 0), 0),
      single_receipt_spend: Math.max(...orders.map(o => o.net_total || 0), 0),
      party_buyer: Math.max(...Object.values(itemsByOrder).map(v => Number(v)), 0),
      same_menu_streak: Math.max(...Object.values(sameMenuStreakRaw).map(v => Number(v)), 0),
      morning_visits: orders.filter(o => {
        const hour = new Date(o.created_at).getHours();
        return hour >= 6 && hour < 10;
      }).length,
      evening_visits: orders.filter(o => {
        const hour = new Date(o.created_at).getHours();
        return hour >= 18 || hour < 4;
      }).length,
    };

    // Fetch Titles
    const { data: titles, error: titlesError } = await supabase
      .from('pos_loyalty_titles')
      .select('*')
      .order('rule_threshold', { ascending: true });

    if (titlesError) throw titlesError;

    // Evaluate rules
    const evaluatedTitles = titles.map(title => {
      const { rule_type, rule_threshold, rule_target } = title;
      let currentValue = 0;
      
      switch (rule_type) {
        case 'total_visits': currentValue = stats.total_visits; break;
        case 'lifetime_spend': currentValue = stats.lifetime_spend; break;
        case 'single_receipt_spend': currentValue = stats.single_receipt_spend; break;
        case 'party_buyer': currentValue = stats.party_buyer; break;
        case 'morning_visits': currentValue = stats.morning_visits; break;
        case 'evening_visits': currentValue = stats.evening_visits; break;
        case 'same_menu_streak': currentValue = stats.same_menu_streak; break;
        case 'category_purchase': 
          if (rule_target && itemsByCategoryId[rule_target]) {
            currentValue = itemsByCategoryId[rule_target];
          }
          break;
        case 'specific_menu_purchase':
          if (rule_target && itemsByMenuId[rule_target]) {
            currentValue = itemsByMenuId[rule_target];
          }
          break;
        default: currentValue = stats.total_visits;
      }

      const isUnlocked = currentValue >= rule_threshold;
      
      return {
        ...title,
        isUnlocked,
        currentValue,
        progress: Math.min(100, Math.floor((currentValue / rule_threshold) * 100))
      };
    });

    // Find Active Title
    const unlockedTitles = evaluatedTitles.filter(t => t.isUnlocked);
    const activeTitle = unlockedTitles.length > 0 ? unlockedTitles[unlockedTitles.length - 1] : null;

    if (activeTitle && targetMemberId) {
      const { data: member } = await supabase.from('pos_members').select('title').eq('id', targetMemberId).single();
      if (member && member.title !== activeTitle.name) {
        await supabase.from('pos_members').update({ title: activeTitle.name }).eq('id', targetMemberId);
      }
    }

    return NextResponse.json({ 
      success: true, 
      stats,
      titles: evaluatedTitles,
      activeTitle
    });

  } catch (err: any) {
    console.error('Error calculating titles:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
