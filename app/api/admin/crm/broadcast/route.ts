import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { sendLinePushMessages } from '@/lib/line';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    // 3. Parse request payload
    const body = await req.json();
    const { segment, message, couponId } = body;

    if (!segment || !message) {
      return NextResponse.json({ success: false, error: 'Missing segment or message' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Query all members & orders under this merchant to calculate segments
    const [membersRes, ordersRes] = await Promise.all([
      supabaseAdmin
        .from('pos_members')
        .select('*')
        .eq('merchant_id', merchantId),
      supabaseAdmin
        .from('pos_orders')
        .select('id, member_id, created_at, net_total, status')
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

    // Filter members matching selected RFM segment and having line_user_id
    const targetedMembers = members.filter(m => {
      if (!m.line_user_id) return false;

      const memberOrders = ordersByMember[m.id] || [];
      
      // Calculate Recency (R)
      let recency = 999;
      if (memberOrders.length > 0) {
        const sortedOrders = [...memberOrders].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const diffMs = now - new Date(sortedOrders[0].created_at).getTime();
        recency = Math.max(0, Math.floor(diffMs / MS_PER_DAY));
      }

      // Calculate Frequency (F)
      const frequency = memberOrders.length;

      // Calculate Monetary (M)
      const monetary = memberOrders.reduce((sum, o) => sum + Number(o.net_total || 0), 0);

      // Determine segment
      let memberSegment: 'loyal' | 'churn' | 'inactive' | 'general' = 'general';

      if (frequency >= 10 || monetary >= 3000) {
        if (recency <= 14) {
          memberSegment = 'loyal';
        } else if (recency <= 30) {
          memberSegment = 'churn';
        } else {
          memberSegment = 'inactive';
        }
      } else {
        if (recency > 30) {
          memberSegment = 'inactive';
        } else if (recency > 14) {
          memberSegment = 'churn';
        } else {
          memberSegment = 'general';
        }
      }

      return segment === 'all' || memberSegment === segment;
    });

    if (targetedMembers.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, message: 'No target members found in this segment with linked LINE accounts' });
    }

    // 5. If couponId is provided, fetch coupon & insert pos_member_coupons for targets
    let couponDetails: any = null;
    if (couponId) {
      const { data: coupon, error: couponErr } = await supabaseAdmin
        .from('pos_loyalty_coupons')
        .select('*')
        .eq('id', couponId)
        .maybeSingle();

      if (couponErr || !coupon) {
        return NextResponse.json({ success: false, error: 'Attached coupon not found or inactive' }, { status: 400 });
      }
      couponDetails = coupon;

      // Insert coupons in batches
      const couponInserts = targetedMembers.map(m => ({
        member_id: m.id,
        coupon_id: couponDetails.id,
        coupon_name: couponDetails.name,
        discount_type: couponDetails.discount_type,
        discount_value: couponDetails.discount_value,
        applicable_categories: couponDetails.applicable_categories,
        applicable_items: couponDetails.applicable_items,
        excluded_categories: couponDetails.excluded_categories,
        excluded_items: couponDetails.excluded_items,
        min_order_amount: couponDetails.min_order_amount,
        max_discount_amount: couponDetails.max_discount_amount,
        image_url: couponDetails.image_url,
        status: 'active'
      }));

      const { error: insertErr } = await supabaseAdmin
        .from('pos_member_coupons')
        .insert(couponInserts);

      if (insertErr) {
        console.error('Error inserting member coupons:', insertErr);
        return NextResponse.json({ success: false, error: `Failed to award coupons: ${insertErr.message}` }, { status: 500 });
      }
    }

    // 6. Broadcast push messages in parallel (or sequential to respect LINE rate-limiting)
    let successCount = 0;
    const errors: string[] = [];

    // Personalize message and send
    for (const member of targetedMembers) {
      try {
        const personalizedText = message
          .replace(/{name}/g, member.display_name || 'ลูกค้า')
          .replace(/{points}/g, String(member.points || 0));

        const messages = [{ type: 'text', text: personalizedText }];
        
        // Push message to LINE
        await sendLinePushMessages(member.line_user_id, messages);
        successCount++;
      } catch (err: any) {
        console.error(`Failed to send LINE message to ${member.id}:`, err);
        errors.push(`Member ${member.display_name || member.id}: ${err.message}`);
      }
    }

    // 7. Log action to audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      action: 'crm_targeted_line_broadcast',
      details: {
        segment,
        message,
        couponId,
        couponName: couponDetails?.name || null,
        targetCount: targetedMembers.length,
        successCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Log first 10 errors
      }
    });

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      totalCount: targetedMembers.length,
      errorsCount: errors.length,
      errors: errors.slice(0, 15)
    });

  } catch (err: any) {
    console.error('Broadcast API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
