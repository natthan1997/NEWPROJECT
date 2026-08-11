import { supabase } from '@/lib/supabaseClient'

export const fetchOrGenerateLoyaltyToken = async (
  orderId: string | undefined | null,
  netTotal: number,
  shopSettings: any,
  cartItems?: any[]
): Promise<{ token: string | null; points: number }> => {
  if (!orderId) return { token: null, points: 0 }

  const earnThb = shopSettings?.opening_hours?.loyalty_earn_thb !== undefined 
    ? shopSettings.opening_hours.loyalty_earn_thb 
    : (shopSettings?.opening_hours?.loyalty_earn_rate || 100)
  const earnPts = shopSettings?.opening_hours?.loyalty_earn_pts !== undefined 
    ? shopSettings.opening_hours.loyalty_earn_pts 
    : 1
  const pointsToGenerate = earnThb > 0 ? Math.floor(Math.max(0, netTotal) / earnThb) * earnPts : 0

  try {
    const isUuid = typeof orderId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    if (isUuid) {
      // Check if existing order already completed points claim
      const { data: orderData } = await supabase
        .from('pos_orders')
        .select('customer_id, customer_name, points_earned')
        .eq('id', orderId)
        .maybeSingle();

      if (orderData && (orderData.customer_id || orderData.customer_name || (orderData.points_earned && orderData.points_earned > 0))) {
        return { token: null, points: 0 }
      }
    }

    // Always generate/sync via API so draft cartItems are 100% written to pos_order_items in DB
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/pos/points/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ points: pointsToGenerate, orderId, cartItems }),
    })
    const result = await res.json()
    if (result.token) {
      return { token: result.token, points: pointsToGenerate }
    }

    // Fallback: Check if unused token exists
    const { data: existing } = await supabase
      .from('pos_qr_reward_tokens')
      .select('token')
      .eq('order_id', orderId)
      .eq('is_used', false)
      .maybeSingle()

    if (existing?.token) {
      return { token: existing.token, points: pointsToGenerate }
    }

    return { token: null, points: pointsToGenerate }
  } catch (err) {
    console.error('Error fetching/generating loyalty token:', err)
    return { token: null, points: pointsToGenerate }
  }
}

