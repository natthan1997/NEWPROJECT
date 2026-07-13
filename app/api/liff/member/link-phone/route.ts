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
        const { lineUserId, phone, fullName, dateOfBirth, firstName, lastName, gender, favoriteMenu, pdpaConsent } = body

        if (!lineUserId || !phone) {
            return NextResponse.json({ error: 'Missing lineUserId or phone' }, { status: 400 })
        }

        const supabase = createSupabaseServiceClient()
        
        // 1. Get LINE member
        const { data: lineMember } = await supabase
            .from('pos_members')
            .select('*')
            .eq('line_user_id', lineUserId)
            .maybeSingle()
            
        if (!lineMember) {
            return NextResponse.json({ error: 'LINE member not found' }, { status: 404 })
        }

        // 2. Get Phone member
        const { data: phoneMember } = await supabase
            .from('pos_members')
            .select('*')
            .eq('phone', phone)
            .not('id', 'eq', lineMember.id)
            .maybeSingle()

        if (phoneMember) {
            // MERGE ACCOUNTS
            const combinedPoints = (lineMember.points || 0) + (phoneMember.points || 0)
            const combinedTotal = (lineMember.total_accumulated_points || 0) + (phoneMember.total_accumulated_points || 0)

            // Update LINE member with combined points, phone number, and all new fields
            await supabase.from('pos_members').update({
                phone: phone,
                points: combinedPoints,
                total_accumulated_points: combinedTotal,
                full_name: fullName || phoneMember.full_name || undefined,
                first_name: firstName || undefined,
                last_name: lastName || undefined,
                date_of_birth: dateOfBirth || lineMember.date_of_birth || phoneMember.date_of_birth || undefined,
                gender: gender || lineMember.gender || phoneMember.gender || undefined,
                favorite_menu: favoriteMenu || lineMember.favorite_menu || undefined,
                pdpa_consent: pdpaConsent !== undefined ? pdpaConsent : lineMember.pdpa_consent
            }).eq('id', lineMember.id)

            // Re-assign history
            await supabase.from('pos_points_history').update({
                member_id: lineMember.id
            }).eq('member_id', phoneMember.id)
            
            // Delete Phone member
            await supabase.from('pos_members').delete().eq('id', phoneMember.id)
            
            return NextResponse.json({ success: true, merged: true, newPoints: combinedPoints })
        } else {
            // JUST UPDATE PHONE AND REGISTRATION FIELDS
            await supabase.from('pos_members').update({
                phone: phone,
                full_name: fullName || undefined,
                first_name: firstName || undefined,
                last_name: lastName || undefined,
                date_of_birth: dateOfBirth || undefined,
                gender: gender || undefined,
                favorite_menu: favoriteMenu || undefined,
                pdpa_consent: pdpaConsent !== undefined ? pdpaConsent : undefined
            }).eq('id', lineMember.id)
            
            return NextResponse.json({ success: true, merged: false, newPoints: lineMember.points })
        }
    } catch (error) {
        console.error('POST /api/liff/member/link-phone error', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
