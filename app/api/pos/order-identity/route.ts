export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { reservePOSOrderIdentity } from '@/lib/posOrderIdentity'

const env = (value?: string) => (value || '').trim()

const createServiceClient = () => {
  const supabaseUrl = env(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = env(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient<any>(supabaseUrl, serviceRoleKey)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createServiceClient()
    const branchId = typeof body?.branchId === 'string' ? body.branchId : null

    let shopSettings = null
    if (branchId) {
      const { data } = await supabase
        .from('pos_shop_settings')
        .select('*')
        .eq('branch_id', branchId)
        .maybeSingle()
      if (data) shopSettings = data
    } else {
      const { data } = await supabase
        .from('pos_shop_settings')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle()
      if (data) shopSettings = data
    }

    const identity = await reservePOSOrderIdentity(supabase, {
      orderType: typeof body?.orderType === 'string' ? body.orderType : null,
      branchId,
      shiftId: typeof body?.shiftId === 'string' ? body.shiftId : null,
      existingOrderId: typeof body?.existingOrderId === 'string' ? body.existingOrderId : null,
      tableName: typeof body?.tableName === 'string' ? body.tableName : null,
      shopSettings,
    })

    return NextResponse.json({ ok: true, ...identity })
  } catch (error: any) {
    console.error('POS order identity API error:', error)
    return NextResponse.json({ error: error.message || 'Order identity API error' }, { status: 500 })
  }
}
