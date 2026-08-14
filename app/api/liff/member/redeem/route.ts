import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { lineUserId, couponId, useBirthdayFree } = await req.json();

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

    let actualCost = coupon.cost_points;
    let descriptionPrefix = '';

    if (useBirthdayFree) {
      // 1. Verify it's their birthday month
      const dobStr = member.date_of_birth || member.dateOfBirth;
      if (!dobStr) {
        return NextResponse.json({ success: false, error: 'ไม่สามารถใช้สิทธิ์ได้เนื่องจากไม่มีข้อมูลวันเกิด' }, { status: 400 });
      }
      const dob = new Date(dobStr);
      const today = new Date();
      if (dob.getMonth() !== today.getMonth()) {
        return NextResponse.json({ success: false, error: 'สิทธิ์วันเกิดสามารถใช้ได้เฉพาะในเดือนเกิดเท่านั้น' }, { status: 400 });
      }

      // 2. Check pos_points_history for usage this year
      const currentYear = today.getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const { data: usedHistory, error: historyError } = await supabaseAdmin
        .from('pos_points_history')
        .select('id')
        .eq('member_id', member.id)
        .like('description', '[BIRTHDAY_FREE]%')
        .gte('created_at', startOfYear)
        .limit(1);

      if (historyError) {
        console.error('History check error:', historyError);
        return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' }, { status: 500 });
      }

      if (usedHistory && usedHistory.length > 0) {
        return NextResponse.json({ success: false, error: 'คุณใช้สิทธิ์แลกคูปองฟรีสำหรับวันเกิดในปีนี้ไปแล้ว' }, { status: 400 });
      }

      actualCost = 0;
      descriptionPrefix = '[BIRTHDAY_FREE] ';
    }

    if (member.points < actualCost) {
      return NextResponse.json({ success: false, error: 'Not enough points' }, { status: 400 });
    }

    // Transaction-like operations
    const newPoints = member.points - actualCost;

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
          points_change: -actualCost,
          type: 'redeem',
          description: `${descriptionPrefix}Redeemed coupon: ${coupon.name}`
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
