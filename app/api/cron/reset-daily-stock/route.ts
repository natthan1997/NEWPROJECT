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

        // 1. Fetch all shop settings to find items that need restocking
        const { data: shops, error: shopsError } = await supabase
            .from('pos_shop_settings')
            .select('id, branch_id, settings')

        if (shopsError) throw shopsError

        let totalRestocked = 0

        for (const shop of shops) {
            const settings = shop.settings || {}
            const autoRestockItems = settings.auto_restock_daily_items || []

            if (autoRestockItems.length > 0) {
                // Restock items in pos_menu_items
                const { error: updateMenuError } = await supabase
                    .from('pos_menu_items')
                    .update({ in_stock: true })
                    .in('id', autoRestockItems)

                if (updateMenuError) {
                    console.error(`Failed to restock items for branch ${shop.branch_id}:`, updateMenuError)
                    continue
                }

                // Clear the auto_restock_daily_items array
                const updatedSettings = { ...settings }
                delete updatedSettings.auto_restock_daily_items

                const { error: updateSettingsError } = await supabase
                    .from('pos_shop_settings')
                    .update({ settings: updatedSettings })
                    .eq('id', shop.id)
                
                if (updateSettingsError) {
                    console.error(`Failed to update settings for branch ${shop.branch_id}:`, updateSettingsError)
                } else {
                    totalRestocked += autoRestockItems.length
                }
            }
        }

        return NextResponse.json({ success: true, restocked_items_count: totalRestocked })
    } catch (error: any) {
        console.error('Reset Daily Stock Cron Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
