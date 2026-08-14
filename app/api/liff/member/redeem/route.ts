import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { lineUserId, couponId } = await req.json();

    if (!lineUserId || !couponId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const [ memberRes, couponRes ] = await Promise.all([
      supabaseAdmin
        .from('pos_members')
        .select('*')
        .eq('line_user_id', lineUserId)
        .single(),
      supabaseAdmin
        .from('pos_loyalty_coupons')
        .select('*')
        .eq('id', couponId)
        .single()
    ]);

    const member = memberRes.data;
    const memberError = memberRes.error;
    const coupon = couponRes.data;
    const couponError = couponRes.error;

    if (memberError || !member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    if (couponError || !coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ success: false, error: 'Coupon is not active' }, { status: 400 });
    }

    if (member.points < coupon.cost_points) {
      return NextResponse.json({ success: false, error: 'Not enough points' }, { status: 400 });
    }

    // Transaction-like operations
    const newPoints = member.points - coupon.cost_points;

    // Execute writes in parallel
    const [ updateMemberResult, insertCouponResult, insertHistoryResult ] = await Promise.all([
      supabaseAdmin
        .from('pos_members')
        .update({ points: newPoints })
        .eq('id', member.id),
      
      supabaseAdmin
        .from('pos_member_coupons')
        .insert([{
          member_id: member.id,
          coupon_id: coupon.id,
          coupon_name: coupon.name,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          applicable_categories: coupon.applicable_categories,
          applicable_items: coupon.applicable_items,
          excluded_categories: coupon.excluded_categories,
          excluded_items: coupon.excluded_items,
          min_order_amount: coupon.min_order_amount,
          max_discount_amount: coupon.max_discount_amount,
          image_url: coupon.image_url,
          status: 'active'
        }]),

      supabaseAdmin
        .from('pos_points_history')
        .insert([{
          member_id: member.id,
          points_change: -coupon.cost_points,
          type: 'redeem',
          description: `Redeemed coupon: ${coupon.name}`
        }])
    ]);

    if (updateMemberResult.error) throw updateMemberResult.error;
    if (insertCouponResult.error) throw insertCouponResult.error;
    if (insertHistoryResult.error) throw insertHistoryResult.error;

    return NextResponse.json({ success: true, newPoints });

  } catch (err: any) {
    console.error('Redeem API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
