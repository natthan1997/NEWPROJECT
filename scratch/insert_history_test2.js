const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// using ANON key this time to test RLS!
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const memberId = '36884b18-ed44-463e-8e19-c52aa9a0b8dc';
  const finishModalOrder = {
    id: '3ed00be1-9cb4-4cbe-bdf9-fc0da42cf106',
    order_type: 'delivery',
    order_number: 'DEL#260714-8043'
  }
  const pointsToEarn = 1;
  const res = await supabase.from('pos_points_history').insert({
    member_id: memberId,
    order_id: finishModalOrder.id,
    points: pointsToEarn,
    points_change: pointsToEarn,
    type: 'earn',
    description: `สะสมจากการสั่งซื้อ Delivery #${finishModalOrder.order_number}`,
  })
  console.log("Insert result with ANON key:");
  console.log(res);
}

main();
