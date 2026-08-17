import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { sendLineNotification, sendLineFlexNotification } from '@/lib/line'

export const dynamic = 'force-dynamic'

function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function awardLoyaltyPointsOnce(supabase: ReturnType<typeof createSupabaseServiceClient>, order: any) {
  if (!order?.line_user_id) return

  let earnThb = 100
  let earnPts = 1

  try {
    const { data: shopSettings } = await supabase
      .from('pos_shop_settings')
      .select('opening_hours')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      
    const oh = shopSettings?.opening_hours || {}
    earnThb = oh.loyalty_earn_thb !== undefined ? oh.loyalty_earn_thb : (oh.loyalty_earn_rate || 100)
    earnPts = oh.loyalty_earn_pts !== undefined ? oh.loyalty_earn_pts : 1
  } catch (err) {
    console.error('Error fetching shop settings for stripe point accrual:', err)
  }

  const deliveryFee = Number(order.delivery_fee || 0)
  const amountForPoints = Number(order.total_amount || order.net_total || 0) - deliveryFee
  const pointsToEarn = earnThb > 0 ? Math.floor(amountForPoints / earnThb) * earnPts : 0
  if (pointsToEarn <= 0) return

  const { data: existingHistory } = await supabase
    .from('pos_points_history')
    .select('id')
    .eq('order_id', order.id)
    .eq('type', 'earn')
    .limit(1)
    .maybeSingle()

  if (existingHistory) {
    return
  }

  try {
    let memberId = order.customer_id
    let hasPhone = false
    
    if (order.line_user_id) {
      const { data: memberData } = await supabase.from('pos_members').select('id, phone').eq('line_user_id', order.line_user_id).maybeSingle()
      if (memberData?.id) {
        memberId = memberData.id
        if (memberData.phone) hasPhone = true
      }
    } else if (memberId) {
      const { data: memberData } = await supabase.from('pos_members').select('phone').eq('id', memberId).maybeSingle()
      if (memberData?.phone) hasPhone = true
    }

    if (!memberId || !hasPhone) return 

    await supabase.rpc('increment_member_points', {
      user_id: order.line_user_id,
      points_to_add: pointsToEarn,
    })

    try {
       const { evaluateOrderMissions } = await import('@/lib/gamification');
       await evaluateOrderMissions(order.id, memberId);
    } catch (gamiErr) {
       console.error('Webhook Gamification Error:', gamiErr);
    }

    const historyPayload = {
      member_id: memberId,
      order_id: order.id,
      points: pointsToEarn,
      points_change: pointsToEarn,
      type: 'earn',
      description: `สะสมจากการสั่งซื้อ ${order.order_type === 'takeaway' ? 'Takeaway' : order.order_type === 'delivery' ? 'Delivery' : 'หน้าร้าน'} #${order.order_number}`,
    }

    const { error: historyError } = await supabase
      .from('pos_points_history')
      .insert(historyPayload)

    if (historyError && historyError.message.includes('column "description" of relation "pos_points_history" does not exist')) {
      const { description, ...fallbackPayload } = historyPayload
      await supabase.from('pos_points_history').insert(fallbackPayload)
    } else if (historyError) {
      throw historyError
    }
  } catch (error) {
    console.error('Point accrual error:', error)
  }
}

async function sendOrderPaidNotificationOnce(supabase: ReturnType<typeof createSupabaseServiceClient>, order: any) {
  if (!order?.line_user_id) return

  const { data: items } = await supabase
    .from('pos_order_items')
    .select(`quantity, pos_menu_items(name, sale_price)`)
    .eq('order_id', order.id)

  const mappedItems = (items || []).map((it: any) => ({
    name: it.pos_menu_items?.name || 'เมนูพิเศษ',
    quantity: it.quantity,
    sale_price: it.pos_menu_items?.sale_price || 0,
  }))

  await sendLineFlexNotification(order.line_user_id, {
    status: 'paid',
    orderNumber: order.order_number,
    orderId: order.id,
    totalAmount: order.total_amount,
    deliveryFee: order.delivery_fee,
    items: mappedItems,
  })
}

async function settlePosOrderPayment(args: {
  lookupColumn: 'stripe_session_id' | 'payment_intent_id'
  lookupValue: string
  customerName?: string
  customerImage?: string
}) {
  const supabase = createSupabaseServiceClient()
  const { data: order, error } = await supabase
    .from('pos_orders')
    .select('id, line_user_id, total_amount, delivery_fee, order_number, status, paid_at, customer_name, customer_image, table_id')
    .eq(args.lookupColumn, args.lookupValue)
    .maybeSingle()

  if (error) {
    console.error('POS payment lookup error:', error)
    return false
  }

  if (!order) {
    return false
  }

  const alreadyPaid = order.status === 'paid' && Boolean(order.paid_at)
  if (!alreadyPaid) {
    const { error: updateError } = await supabase
      .from('pos_orders')
      .update({
        status: 'paid',
        paid_at: order.paid_at || new Date().toISOString(),
        customer_name: args.customerName || order.customer_name,
        customer_image: args.customerImage || order.customer_image,
      })
      .eq('id', order.id)

    if (order.table_id) {
      await supabase.from('pos_tables').update({ status: 'available' }).eq('id', order.table_id)
    }

    await supabase.from('pos_order_payments').update({ status: 'paid' }).eq('order_id', order.id)

    if (updateError) {
      console.error('POS payment update error:', updateError)
      return false
    }
  }

  if (alreadyPaid) {
    return true
  }

  await awardLoyaltyPointsOnce(supabase, order)
  await sendOrderPaidNotificationOnce(supabase, order)
  return true
}

async function settlePartialPosOrderPayment(intentId: string) {
  const supabase = createSupabaseServiceClient()
  
  const { data: payment, error: pError } = await supabase
    .from('pos_order_payments')
    .update({ status: 'paid' })
    .eq('stripe_payment_intent_id', intentId)
    .select('order_id, amount')
    .single()
    
  if (pError || !payment) {
    return false;
  }
  
  const { data: allPayments } = await supabase
    .from('pos_order_payments')
    .select('amount')
    .eq('order_id', payment.order_id)
    .eq('status', 'paid')
    
  const totalPaid = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  
  const { data: order } = await supabase
    .from('pos_orders')
    .select('id, total_amount, status, line_user_id, order_number, table_id')
    .eq('id', payment.order_id)
    .single()
    
  if (order && totalPaid >= Number(order.total_amount) && order.status !== 'paid') {
    await supabase.from('pos_orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id)
    if (order.table_id) {
      await supabase.from('pos_tables').update({ status: 'available' }).eq('id', order.table_id)
    }
    await awardLoyaltyPointsOnce(supabase, order)
    await sendOrderPaidNotificationOnce(supabase, order)
  }
  
  return true;
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is missing');
    }
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    await settlePosOrderPayment({
      lookupColumn: 'stripe_session_id',
      lookupValue: session.id,
      customerName: session.metadata?.customer_name || '',
      customerImage: session.metadata?.customer_image || '',
    })
  } else if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as any
    
    if (intent.metadata?.type === 'pos_order') {
      await settlePartialPosOrderPayment(intent.id)
    } else {
      await settlePosOrderPayment({
        lookupColumn: 'payment_intent_id',
        lookupValue: intent.id,
      })
    }
  }

  return NextResponse.json({ received: true })
}
