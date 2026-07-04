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
        const { lineUserId, displayName, avatarUrl } = body

        if (!lineUserId) {
            return NextResponse.json({ error: 'Missing lineUserId' }, { status: 400 })
        }

        const supabase = createSupabaseServiceClient()
        
        // Ensure member exists
        const { data: member, error: memberError } = await supabase
            .from('pos_members')
            .select('*')
            .eq('line_user_id', lineUserId)
            .maybeSingle()
        
        if (!member) {
            // Welcome Bonus! Give 200 points to trigger Endowed Progress Effect
            const { data: newMember, error: insertError } = await supabase.from('pos_members').insert({
                line_user_id: lineUserId,
                display_name: displayName,
                avatar_url: avatarUrl,
                points: 0,
                total_accumulated_points: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).select().single()

            if (insertError) {
                console.error('Insert member error:', insertError)
                return NextResponse.json({ error: 'Database error' }, { status: 500 })
            }
            
            

            return NextResponse.json({ success: true, member: newMember, isNew: true })
        } else {
            // Update profile if they scan but info was empty
            if (!member.display_name || !member.avatar_url) {
                const { data: updated } = await supabase.from('pos_members').update({
                    display_name: member.display_name || displayName,
                    avatar_url: member.avatar_url || avatarUrl,
                    updated_at: new Date().toISOString()
                }).eq('id', member.id).select().single()
                
                return NextResponse.json({ success: true, member: updated, isNew: false })
            }
        }

        return NextResponse.json({ success: true, member, isNew: false })
    } catch (error) {
        console.error('POST /api/liff/member/init error', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
