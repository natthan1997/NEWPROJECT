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

import { normalizePhone, getPhoneSearchOrFilter } from '@/lib/phoneUtils'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}))
        const { lineUserId, phone, fullName, dateOfBirth, firstName, lastName, gender, pdpaConsent } = body

        if (!lineUserId || !phone) {
            return NextResponse.json({ error: 'Missing lineUserId or phone' }, { status: 400 })
        }

        const norm = normalizePhone(phone);
        const cleanPhone = norm.international || phone;

        const supabase = createSupabaseServiceClient()
        
        // 1. Get LINE member
        const { data: lineMember } = await supabase
            .from('pos_members')
            .select('*')
            .eq('line_user_id', lineUserId)
            .maybeSingle()

        // 2. Get Phone member using fuzzy phone search (local, intl, last 9 digits)
        let phoneQuery = supabase
            .from('pos_members')
            .select('*')
            .or(getPhoneSearchOrFilter(phone));

        if (lineMember?.id) {
            phoneQuery = phoneQuery.not('id', 'eq', lineMember.id);
        }
        const { data: phoneMember } = await phoneQuery.maybeSingle();

        if (!lineMember) {
            if (phoneMember) {
                // Link existing phone member to this line_user_id
                await supabase.from('pos_members').update({
                    line_user_id: lineUserId,
                    phone: cleanPhone,
                    full_name: fullName || phoneMember.full_name || undefined,
                    first_name: firstName || phoneMember.first_name || undefined,
                    last_name: lastName || phoneMember.last_name || undefined,
                    date_of_birth: dateOfBirth || phoneMember.date_of_birth || undefined,
                    gender: gender || phoneMember.gender || undefined,
                    pdpa_consent: pdpaConsent !== undefined ? pdpaConsent : phoneMember.pdpa_consent
                }).eq('id', phoneMember.id);
                return NextResponse.json({ success: true, merged: true, newPoints: phoneMember.points || 0 });
            } else {
                // Create brand NEW member record
                const { data: newMember, error: createErr } = await supabase
                    .from('pos_members')
                    .insert([{
                        line_user_id: lineUserId,
                        phone: cleanPhone,
                        full_name: fullName || `${firstName || ''} ${lastName || ''}`.trim() || undefined,
                        first_name: firstName || undefined,
                        last_name: lastName || undefined,
                        date_of_birth: dateOfBirth || undefined,
                        gender: gender || undefined,
                        pdpa_consent: pdpaConsent !== undefined ? pdpaConsent : true,
                        points: 0,
                        total_accumulated_points: 0
                    }])
                    .select()
                    .single();

                if (createErr) {
                    console.error('Failed to create new member in link-phone:', createErr);
                    return NextResponse.json({ error: 'Failed to create member record: ' + createErr.message }, { status: 500 });
                }
                return NextResponse.json({ success: true, merged: false, newPoints: 0 });
            }
        }

        if (phoneMember) {
            // MERGE ACCOUNTS
            const combinedPoints = (lineMember.points || 0) + (phoneMember.points || 0)
            const combinedTotal = (lineMember.total_accumulated_points || 0) + (phoneMember.total_accumulated_points || 0)

            // Update LINE member with combined points, phone number, and all new fields
            await supabase.from('pos_members').update({
                phone: cleanPhone,
                points: combinedPoints,
                total_accumulated_points: combinedTotal,
                full_name: fullName || phoneMember.full_name || undefined,
                first_name: firstName || undefined,
                last_name: lastName || undefined,
                date_of_birth: dateOfBirth || lineMember.date_of_birth || phoneMember.date_of_birth || undefined,
                gender: gender || lineMember.gender || phoneMember.gender || undefined,
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
                pdpa_consent: pdpaConsent !== undefined ? pdpaConsent : undefined
            }).eq('id', lineMember.id)
            
            return NextResponse.json({ success: true, merged: false, newPoints: lineMember.points })
        }
    } catch (error) {
        console.error('POST /api/liff/member/link-phone error', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
