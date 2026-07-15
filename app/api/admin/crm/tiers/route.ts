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
    const supabase = createSupabaseServiceClient()
    const body = await req.json()
    const { action, id, name, min_points, multiplier, discount_rate, benefits, bg_hex, text_hex, bar_hex, order_index } = body

    if (action === 'delete') {
      if (id && !id.startsWith('new-')) {
        const { error } = await supabase.from('pos_member_tiers').delete().eq('id', id)
        if (error) throw error
      }
      return NextResponse.json({ success: true })
    }

    const data: any = {
      name,
      min_points: Number(min_points),
      multiplier: Number(multiplier || 1.0),
      discount_rate: Number(discount_rate || 0.0),
      benefits,
      bg_hex,
      text_hex,
      bar_hex,
      order_index: Number(order_index || 0)
    }

    if (id && !id.startsWith('new-')) {
      const { error } = await supabase.from('pos_member_tiers').update(data).eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('pos_member_tiers').insert([data])
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('CRM Tier update error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
