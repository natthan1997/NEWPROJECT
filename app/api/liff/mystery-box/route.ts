import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const COST_TO_PLAY = 50;

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

    if ((member.points || 0) < COST_TO_PLAY) {
      return NextResponse.json({ error: 'Not enough points' }, { status: 400 })
    }

    // 2. Fetch mystery box config
    const { data: settings } = await supabase
      .from('pos_shop_settings')
      .select('mystery_box_config')
      .limit(1)
      .single();

    let prizes = [
      { id: 1, name: '500 คะแนน', type: 'points', value: 500, probability: 5 },
      { id: 2, name: '100 คะแนน', type: 'points', value: 100, probability: 10 },
      { id: 3, name: '50 คะแนน', type: 'points', value: 50, probability: 25 },
      { id: 4, name: '20 คะแนน', type: 'points', value: 20, probability: 60 }
    ];

    if (settings?.mystery_box_config && Array.isArray(settings.mystery_box_config) && settings.mystery_box_config.length > 0) {
      prizes = settings.mystery_box_config;
    }

    // 3. Randomize reward
    const rand = Math.random() * 100;
    let cumulative = 0;
    let wonPrize = prizes[prizes.length - 1];

    for (const prize of prizes) {
      cumulative += Number(prize.probability);
      if (rand <= cumulative) {
        wonPrize = prize;
        break;
      }
    }

    const wonPoints = Number(wonPrize.value) || 0;
    const netPointsChange = wonPoints - COST_TO_PLAY;
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
      points_change: -COST_TO_PLAY,
      points: COST_TO_PLAY,
      type: 'redeem',
      description: 'เล่นกล่องสุ่ม',
    })

    // Insert history for earning
    await supabase.from('pos_points_history').insert({
      member_id: member.id,
      points_change: wonPoints,
      points: wonPoints,
      type: 'earn',
      description: `รางวัลจากกล่องสุ่ม: ${wonPrize.name}`,
    })

    return NextResponse.json({
      success: true,
      wonPoints,
      prizeName: wonPrize.name,
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