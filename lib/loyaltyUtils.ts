import { supabase } from '@/lib/supabaseClient'

export const fetchOrGenerateLoyaltyToken = async (
  orderId: string | undefined | null,
  netTotal: number,
  shopSettings: any
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
    const isDraftOrder = !orderId || orderId.startsWith('cart_') || (typeof orderId === 'string' && orderId.length > 30 && !orderId.includes('-'));

    if (!isDraftOrder) {
      // 1 & 2: Check if existing order already claimed points or unused token exists
      const [{ data: orderData }, { data: existing }] = await Promise.all([
        supabase
          .from('pos_orders')
          .select('customer_id, customer_name, points_earned')
          .eq('id', orderId)
          .maybeSingle(),
        supabase
          .from('pos_qr_reward_tokens')
          .select('token')
          .eq('order_id', orderId)
          .eq('is_used', false)
          .maybeSingle()
      ]);

      if (orderData && (orderData.customer_id || orderData.customer_name || (orderData.points_earned && orderData.points_earned > 0))) {
        return { token: null, points: 0 }
      }

      if (existing?.token) {
        // Sync points in DB in case cart total changed since token creation
        await supabase
          .from('pos_qr_reward_tokens')
          .update({ points: pointsToGenerate })
          .eq('token', existing.token);
        return { token: existing.token, points: pointsToGenerate }
      }
    } else {
      // Check if unused token already exists for this draft order
      const { data: existing } = await supabase
        .from('pos_qr_reward_tokens')
        .select('token')
        .eq('order_id', orderId)
        .eq('is_used', false)
        .maybeSingle()

      if (existing?.token) {
        // Sync points in DB in case cart total changed since token creation
        await supabase
          .from('pos_qr_reward_tokens')
          .update({ points: pointsToGenerate })
          .eq('token', existing.token);
        return { token: existing.token, points: pointsToGenerate }
      }
    }

    // Generate via API
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

