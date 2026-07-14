const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const memberId = '36884b18-ed44-463e-8e19-c52aa9a0b8dc';
  const finishModalOrder = {
    id: '606c82ab-5097-48ed-9d36-6376c0b344ee',
    order_type: 'delivery',
    order_number: 'DEL#260714-8316'
  }
  const pointsToEarn = 1;
  const res = await supabase.from('pos_points_history').insert({
    member_id: memberId,
    order_id: finishModalOrder.id,
    points: pointsToEarn,
    points_change: pointsToEarn,
    type: 'earn',
    description: `สะสมจากการสั่งซื้อ ${finishModalOrder.order_type === 'takeaway' ? 'Takeaway' : finishModalOrder.order_type === 'delivery' ? 'Delivery' : 'หน้าร้าน'} #${finishModalOrder.order_number}`,
  });
  console.log("Insert result:");
  console.log(res);
}

main();
