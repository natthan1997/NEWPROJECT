import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const createSupabaseServiceClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
        global: {
            fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
        }
    })
}

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServiceClient()

        // Fetch active gacha rewards
        const { data: pool, error } = await supabase
            .from('gacha_rewards_pool')
            .select('*')
            .eq('is_active', true)
            .order('rarity_tier', { ascending: false }) // e.g. UR, SR, R, N
        
        if (error) {
            console.error('Fetch gacha pool error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Calculate total weight to give the frontend an idea of the drop rates
        const validPool = (pool || []).filter(item => 
            item.max_quantity === null || (item.current_quantity !== null && item.current_quantity < item.max_quantity)
        )

        const totalWeight = validPool.reduce((sum, item) => sum + (item.probability_weight || 0), 0)

        const poolWithRates = validPool.map(item => ({
            ...item,
            drop_rate_percentage: totalWeight > 0 ? ((item.probability_weight || 0) / totalWeight * 100).toFixed(2) : 0
        }))

        return NextResponse.json({
            success: true,
            pool: poolWithRates,
            totalItems: validPool.length
        })

    } catch (err: any) {
        console.error('Gacha Pool Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
