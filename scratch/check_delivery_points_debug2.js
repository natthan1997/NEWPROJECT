const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: order } = await supabase.from('pos_orders').select('*').eq('id', '606c82ab-5097-48ed-9d36-6376c0b344ee').single();
  const deliveryFee = order.delivery_fee || 0;
  const totalAmount = (order.net_total || order.total_amount || 0) - deliveryFee;
  
  const { data: shopSettingsData } = await supabase.from('pos_shop_settings').select('opening_hours').order('updated_at', { ascending: false }).limit(1).maybeSingle();
  const oh = shopSettingsData?.opening_hours || {};
  const earnThb = oh.loyalty_earn_thb !== undefined ? oh.loyalty_earn_thb : (oh.loyalty_earn_rate || 100);
  const earnPts = oh.loyalty_earn_pts !== undefined ? oh.loyalty_earn_pts : 1;
  const pointsToEarn = earnThb > 0 ? Math.floor(totalAmount / earnThb) * earnPts : 0;
  
  console.log("Order DEL#260714-8316:");
  console.log("delivery_fee:", deliveryFee);
  console.log("pointsToEarn:", pointsToEarn);
  console.log("customer_id:", order.customer_id);
  console.log("line_user_id:", order.line_user_id);
  
  let memberId = order.customer_id;
  if (!memberId && order.line_user_id) {
    const { data: memberData } = await supabase.from('pos_members').select('id').eq('line_user_id', order.line_user_id).maybeSingle();
    if (memberData?.id) memberId = memberData.id;
  }
  
  console.log("Resolved memberId:", memberId);
}

main();
