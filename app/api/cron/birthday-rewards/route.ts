import { NextResponse } from 'next/server'
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

export async function GET(request: Request) {
    // Verify Cron Secret if set in env
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const supabase = createSupabaseServiceClient()
        const currentMonth = new Date().getMonth() + 1 // 1-12
        const currentYear = new Date().getFullYear()

        // 1. Get all members whose birthday is in the current month
        // Supabase/PostgREST doesn't have a native EXTRACT function in the client,
        // so we can either call an RPC or fetch members with non-null birth_date and filter in JS
        // Since pos_members might grow, RPC is better. But for now, let's fetch those with date_of_birth
        const { data: members, error: membersError } = await supabase
            .from('pos_members')
            .select('id, date_of_birth, member_tier')
            .not('date_of_birth', 'is', null)

        if (membersError) throw membersError

        const birthdayMembers = members.filter(m => {
            if (!m.date_of_birth) return false
            const mMonth = new Date(m.date_of_birth).getMonth() + 1
            return mMonth === currentMonth
        })

        if (birthdayMembers.length === 0) {
            return NextResponse.json({ success: true, message: 'No birthdays this month' })
        }

        // 2. Get Tiers to check benefits
        const { data: tiers } = await supabase.from('pos_member_tiers').select('*')
        
        // 3. Process each member
        let issuedCount = 0
        for (const member of birthdayMembers) {
            // Check if they already got a birthday voucher this year
            const { data: existingVouchers } = await supabase
                .from('pos_member_coupons')
                .select('id, created_at')
                .eq('member_id', member.id)
                .ilike('name', '%Birthday%')
                .gte('created_at', `${currentYear}-01-01T00:00:00Z`)
            
            if (existingVouchers && existingVouchers.length > 0) {
                continue // Already received
            }

            // Find tier benefits
            const tier = tiers?.find(t => t.name === member.member_tier)
            if (!tier || !tier.benefits) continue
            
            // Check if benefits include birthday
            const benefits = Array.isArray(tier.benefits) ? tier.benefits : []
            const birthdayBenefit = benefits.find((b: string) => b.toLowerCase().includes('birthday'))
            
            if (birthdayBenefit || member.member_tier === 'Platinum') {
                // Determine voucher details based on tier
                let voucherName = 'Happy Birthday!'
                let discountType = 'free_item'
                let discountValue = 0

                if (member.member_tier === 'Silver') {
                    voucherName = 'Free Birthday Drink'
                } else if (member.member_tier === 'Gold' || member.member_tier === 'Platinum') {
                    voucherName = 'Birthday Drink & Cake'
                }

                // Insert voucher (assumes pos_member_coupons is the correct table)
                // Need to calculate expires_at (end of month)
                const expiresAt = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString()

                await supabase.from('pos_member_coupons').insert({
                    member_id: member.id,
                    name: voucherName,
                    description: `ของขวัญวันเกิดสำหรับสมาชิก ${member.member_tier}`,
                    discount_type: discountType,
                    discount_value: discountValue,
                    is_used: false,
                    expires_at: expiresAt
                })
                issuedCount++
            }
        }

        return NextResponse.json({ success: true, issued: issuedCount })
    } catch (error: any) {
        console.error('Birthday Cron Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
