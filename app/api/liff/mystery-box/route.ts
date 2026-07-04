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

    // 2. Randomize reward
    const rand = Math.random();
    let wonPoints = 20; // 60% chance
    if (rand > 0.95) {
      wonPoints = 500; // 5% chance
    } else if (rand > 0.85) {
      wonPoints = 100; // 10% chance
    } else if (rand > 0.60) {
      wonPoints = 50; // 25% chance
    }

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
      member_id: userId,
      points: COST_TO_PLAY,
      type: 'redeem',
      description: 'เล่นกล่องสุ่ม',
    })

    // Insert history for earning
    await supabase.from('pos_points_history').insert({
      member_id: userId,
      points: wonPoints,
      type: 'earn',
      description: 'รางวัลจากกล่องสุ่ม',
    })

    return NextResponse.json({
      success: true,
      wonPoints,
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