const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: shopSettings } = await supabase.from('pos_shop_settings').select('*').limit(1).single();
  
  // mock lib/loyaltyUtils.ts logic for Draft Order
  const orderId = 'cart_test_123';
  const netTotal = 55;
  
  const earnThb = shopSettings?.opening_hours?.loyalty_earn_thb !== undefined 
    ? shopSettings.opening_hours.loyalty_earn_thb 
    : (shopSettings?.opening_hours?.loyalty_earn_rate || 100);
  const earnPts = shopSettings?.opening_hours?.loyalty_earn_pts !== undefined 
    ? shopSettings.opening_hours.loyalty_earn_pts 
    : 1;
  const pointsToGenerate = earnThb > 0 ? Math.floor(Math.max(0, netTotal) / earnThb) * earnPts : 0;
  
  console.log({ earnThb, earnPts, pointsToGenerate });
}
run();
