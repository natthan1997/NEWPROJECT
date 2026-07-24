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
        const { profileId, reason } = body

        if (!profileId) {
            return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })
        }

        const supabase = createSupabaseServiceClient()

        // Calculate today's date in Bangkok Time
        const nowBangkok = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
        const year = nowBangkok.getFullYear()
        const month = String(nowBangkok.getMonth() + 1).padStart(2, '0')
        const day = String(nowBangkok.getDate()).padStart(2, '0')
        const todayDateStr = `${year}-${month}-${day}` // YYYY-MM-DD

        // Insert into pos_staff_leave_overrides
        const { data, error } = await supabase
            .from('pos_staff_leave_overrides')
            .upsert({
                profile_id: profileId,
                date: todayDateStr,
                reason: reason || 'แจ้งลากะทันหัน'
            }, { onConflict: 'profile_id,date' })
            .select()
            .single()

        if (error) {
            console.error('Insert emergency leave error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data
        })

    } catch (err: any) {
        console.error('Emergency Leave API Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
