import { supabase } from '@/lib/supabaseClient'

export const fetchOrGenerateLoyaltyToken = async (
  orderId: string | undefined | null,
  netTotal: number,
  shopSettings: any
): Promise<{ token: string | null; points: number }> => {
  if (!orderId || netTotal <= 0) return { token: null, points: 0 }

  const earnThb = shopSettings?.opening_hours?.loyalty_earn_thb !== undefined 
    ? shopSettings.opening_hours.loyalty_earn_thb 
    : (shopSettings?.opening_hours?.loyalty_earn_rate || 100)
  const earnPts = shopSettings?.opening_hours?.loyalty_earn_pts !== undefined 
    ? shopSettings.opening_hours.loyalty_earn_pts 
    : 1
  const pointsToGenerate = earnThb > 0 ? Math.floor(netTotal / earnThb) * earnPts : 0

  if (pointsToGenerate <= 0) return { token: null, points: 0 }

  try {
    // 1. Check if the order itself has already accumulated / claimed points
    const { data: orderData } = await supabase
      .from('pos_orders')
      .select('customer_id, customer_name, points_earned')
      .eq('id', orderId)
      .maybeSingle()

    if (orderData && (orderData.customer_id || orderData.customer_name || (orderData.points_earned && orderData.points_earned > 0))) {
      // Points already accumulated for this order -> Do NOT generate or return a QR token
      return { token: null, points: 0 }
    }

    // 2. Check if any token for this order was already claimed (is_used = true)
    const { data: usedTokens } = await supabase
      .from('pos_qr_reward_tokens')
      .select('id')
      .eq('order_id', orderId)
      .eq('is_used', true)
      .limit(1)

    if (usedTokens && usedTokens.length > 0) {
      return { token: null, points: 0 }
    }

    // 3. Check if unused token already exists for this order
    const { data: existing } = await supabase
      .from('pos_qr_reward_tokens')
      .select('token')
      .eq('order_id', orderId)
      .eq('is_used', false)
      .maybeSingle()

    if (existing?.token) {
      return { token: existing.token, points: pointsToGenerate }
    }

    // 4. Otherwise generate via API
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/pos/points/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ points: pointsToGenerate, orderId }),
    })
    const result = await res.json()
    return { token: result.token || null, points: pointsToGenerate }
  } catch (err) {
    console.error('Error fetching/generating loyalty token:', err)
    return { token: null, points: pointsToGenerate }
  }
}
