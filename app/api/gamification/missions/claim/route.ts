import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
        const { memberId, missionId } = body

        if (!memberId || !missionId) {
            return NextResponse.json({ error: 'Missing memberId or missionId' }, { status: 400 })
        }

        const supabase = createSupabaseServiceClient()

        // 1. Check if mission is completed and not claimed
        const { data: progress, error: progressError } = await supabase
            .from('member_mission_progress')
            .select('*')
            .eq('member_id', memberId)
            .eq('mission_id', missionId)
            .single()

        if (progressError || !progress) {
            return NextResponse.json({ error: 'Mission progress not found' }, { status: 404 })
        }

        if (!progress.is_completed) {
            return NextResponse.json({ error: 'Mission is not completed yet' }, { status: 400 })
        }

        if (progress.claimed_at) {
            return NextResponse.json({ error: 'Reward already claimed' }, { status: 400 })
        }

        // 2. Get mission reward details
        const { data: mission, error: missionError } = await supabase
            .from('gamification_missions')
            .select('reward_tickets')
            .eq('id', missionId)
            .single()

        if (missionError || !mission) {
            return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
        }

        // 3. Begin Transaction (Using RPC if available, or sequential updates with Supabase)
        // Since Supabase REST doesn't support transactions out of the box without RPC, we'll do sequential updates.
        // It's safe enough for this level of logic if we mark it claimed first.
        
        const now = new Date().toISOString()
        const { data: updatedProgress, error: updateError } = await supabase
            .from('member_mission_progress')
            .update({ claimed_at: now })
            .eq('id', progress.id)
            .is('claimed_at', null) // Optimistic lock
            .select()
            .single()
            
        if (updateError || !updatedProgress) {
             return NextResponse.json({ error: 'Failed to claim, maybe already claimed' }, { status: 400 })
        }

        // 4. Give tickets to member
        const { data: member, error: memberError } = await supabase
            .from('pos_members')
            .select('gacha_tickets')
            .eq('id', memberId)
            .single()

        if (!memberError && member) {
            const currentTickets = member.gacha_tickets || 0
            const newTickets = currentTickets + (mission.reward_tickets || 1)
            
            await supabase
                .from('pos_members')
                .update({ gacha_tickets: newTickets })
                .eq('id', memberId)
        }

        return NextResponse.json({
            success: true,
            message: 'Reward claimed successfully',
            reward_tickets: mission.reward_tickets,
            claimed_at: now
        })

    } catch (err: any) {
        console.error('Gamification Claim Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
