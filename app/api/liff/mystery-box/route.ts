import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 1. Fetch user to verify points
    const { data: member, error: memberError } = await supabase
      .from('pos_members')
      .select('id, points')
      .eq('line_user_id', userId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Fetch shop settings for mystery box configuration
    const { data: shopSettings } = await supabase
      .from('pos_shop_settings')
      .select('opening_hours')
      .limit(1)
      .single()

    const costToPlay = shopSettings?.opening_hours?.mystery_box_cost !== undefined 
      ? shopSettings.opening_hours.mystery_box_cost 
      : 50;
      
    const prizes = shopSettings?.opening_hours?.mystery_box_prizes || [
        { chance: 60, points: 20 },
        { chance: 25, points: 50 },
        { chance: 10, points: 100 },
        { chance: 5, points: 500 }
    ];

    if ((member.points || 0) < costToPlay) {
      return NextResponse.json({ error: 'Not enough points' }, { status: 400 })
    }

    // 2. Randomize reward based on probabilities
    const rand = Math.random() * 100;
    let wonPrize: any = null;
    let cumulativeChance = 0;
    
    for (const prize of prizes) {
        cumulativeChance += Number(prize.chance);
        if (rand <= cumulativeChance) {
            wonPrize = prize;
            break;
        }
    }
    
    if (!wonPrize && prizes.length > 0) {
        wonPrize = prizes[0];
    }

    const isCoupon = wonPrize?.type === 'coupon';
    const wonPoints = isCoupon ? 0 : Number(wonPrize?.points || 0);

    const netPointsChange = wonPoints - costToPlay;
    const newPoints = (member.points || 0) + netPointsChange;

    // 3. Perform database updates
    // Update member points
    const { error: updateError } = await supabase
      .from('pos_members')
      .update({ points: newPoints, updated_at: new Date().toISOString() })
      .eq('id', member.id)

    if (updateError) throw updateError;

    // Insert history for deduction
    await supabase.from('pos_points_history').insert({
      member_id: member.id,
      points_change: -costToPlay,
      points: costToPlay,
      type: 'redeem',
      description: 'เล่นกล่องสุ่ม',
    })

    if (!isCoupon && wonPoints > 0) {
        // Insert history for earning
        await supabase.from('pos_points_history').insert({
            member_id: member.id,
            points_change: wonPoints,
            points: wonPoints,
            type: 'earn',
            description: 'รางวัลจากกล่องสุ่ม',
        })
    } else if (isCoupon && wonPrize.coupon_name) {
        // Give coupon to member
        await supabase.from('pos_member_coupons').insert({
            member_id: member.id,
            coupon_type: 'loyalty',
            coupon_name: wonPrize.coupon_name,
            status: 'active'
        });
    }

    return NextResponse.json({
      success: true,
      wonPoints,
      wonCoupon: isCoupon ? wonPrize.coupon_name : null,
      newTotal: newPoints
    })
  } catch (error: any) {
    console.error('Mystery Box API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}