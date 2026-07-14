const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: order } = await supabase.from('pos_orders').select('*').eq('id', '3ed00be1-9cb4-4cbe-bdf9-fc0da42cf106').single();
  const deliveryFee = order.delivery_fee || 0;
  const totalAmount = (order.net_total || order.total_amount || 0) - deliveryFee;
  
  const { data: shopSettingsData } = await supabase.from('pos_shop_settings').select('opening_hours').order('updated_at', { ascending: false }).limit(1).maybeSingle();
  const oh = shopSettingsData?.opening_hours || {};
  const earnThb = oh.loyalty_earn_thb !== undefined ? oh.loyalty_earn_thb : (oh.loyalty_earn_rate || 100);
  const earnPts = oh.loyalty_earn_pts !== undefined ? oh.loyalty_earn_pts : 1;
  const pointsToEarn = earnThb > 0 ? Math.floor(totalAmount / earnThb) * earnPts : 0;
  
  console.log("Order net_total:", order.net_total);
  console.log("Order total_amount:", order.total_amount);
  console.log("delivery_fee:", deliveryFee);
  console.log("Amount for points:", totalAmount);
  console.log("earnThb:", earnThb);
  console.log("earnPts:", earnPts);
  console.log("pointsToEarn:", pointsToEarn);
}

main();
