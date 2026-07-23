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

    // Get the member
    const { data: member, error: memberError } = await supabaseAdmin
      .from('pos_members')
      .select('*')
      .eq('line_user_id', lineUserId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    // Get the coupon
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('pos_loyalty_coupons')
      .select('*')
      .eq('id', couponId)
      .single();

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

    const { error: updateError } = await supabaseAdmin
      .from('pos_members')
      .update({ points: newPoints })
      .eq('id', member.id);

    if (updateError) throw updateError;

     // Create member coupon
     const { error: insertCouponError } = await supabaseAdmin
       .from('pos_member_coupons')
       .insert([{
         member_id: member.id,
         coupon_id: coupon.id,
         coupon_name: coupon.name,
         discount_type: coupon.discount_type,
         discount_value: coupon.discount_value,
         applicable_categories: coupon.applicable_categories,
         image_url: coupon.image_url,
         status: 'active'
       }]);

    if (insertCouponError) throw insertCouponError;

    // Log history
    await supabaseAdmin
      .from('pos_points_history')
      .insert([{
        member_id: member.id,
        points: -coupon.cost_points,
        type: 'redeem',
        description: `Redeemed coupon: ${coupon.name}`
      }]);

    return NextResponse.json({ success: true, newPoints });

  } catch (err: any) {
    console.error('Redeem API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
