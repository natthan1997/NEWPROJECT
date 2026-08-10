import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestUser } from '@/lib/server/requestAuth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const createSupabaseServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

async function ensureStaffRole(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error || !profile) return false

  const role = String(profile.role || '').toLowerCase()
  return role === 'staff' || role === 'admin'
}

export async function POST(req: NextRequest) {
  try {
    const requestUser = await resolveRequestUser(req).catch(() => null)
    const supabase = createSupabaseServiceClient()

    const body = await req.json().catch(() => ({}))
    const points = Number(body?.points ?? 0)
    const orderId = body?.orderId || null
    const cartItems = Array.isArray(body?.cartItems) ? body.cartItems : []

    if (isNaN(points) || points < 0) {
      return NextResponse.json({ error: 'Invalid points amount' }, { status: 400 })
    }

    // Save/sync draft order and items if cartItems are provided and orderId is valid
    if (orderId && cartItems.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(orderId)) {
        try {
          const totalAmount = cartItems.reduce((sum: number, item: any) => sum + Number(item.subtotal || (item.unit_price * item.quantity) || 0), 0)
          
          // 1. Ensure draft order exists in pos_orders
          const { data: existingOrd } = await supabase
            .from('pos_orders')
            .select('id, status')
            .eq('id', orderId)
            .maybeSingle()

          if (!existingOrd) {
            await supabase.from('pos_orders').insert({
              id: orderId,
              status: 'pending',
              order_number: 'DRAFT',
              total_amount: totalAmount,
              order_source: 'pos',
              created_at: new Date().toISOString()
            })
          }

          // 2. Insert/update items in pos_order_items
          const itemsToInsert = cartItems.map((i: any) => ({
            order_id: orderId,
            item_id: (i.item_id || i.id) && uuidRegex.test(i.item_id || i.id) ? (i.item_id || i.id) : null,
            name: i.name || i.item_name || 'สินค้า',
            quantity: Number(i.quantity || 1),
            unit_price: Number(i.unit_price || 0),
            subtotal: Number(i.subtotal || (Number(i.unit_price || 0) * Number(i.quantity || 1))),
            selected_modifiers: i.selected_modifiers || []
          }))

          await supabase.from('pos_order_items').delete().eq('order_id', orderId)
          await supabase.from('pos_order_items').insert(itemsToInsert)
        } catch (draftErr) {
          console.error('Failed to sync draft order items:', draftErr)
        }
      }
    }

    // Generate a secure random token
    const token = crypto.randomBytes(16).toString('hex')

    const { data, error } = await supabase
      .from('pos_qr_reward_tokens')
      .insert({
        token,
        points,
        order_id: orderId,
        created_by: requestUser?.id || null,
      })
      .select('token')
      .single()

    if (error) {
      console.error('Error generating QR token:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, token: data.token })
  } catch (error) {
    console.error('POST /api/pos/points/generate error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
