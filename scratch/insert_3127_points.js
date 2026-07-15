const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const memberId = '36884b18-ed44-463e-8e19-c52aa9a0b8dc';
  const orderId = 'fb61ab13-c3c7-4c25-84ed-f33d9ca3aee6'; // DEL#260714-3127
  const pointsToEarn = 1;

  // 1. Increment member points
  const { data: member, error: rpcErr } = await supabase.rpc('increment_member_points', {
    user_id: memberId,
    points_to_add: pointsToEarn,
  });
  console.log("RPC result:", member, rpcErr);

  // 2. Insert into pos_points_history
  const { data: hist, error: insErr } = await supabase.from('pos_points_history').insert({
    member_id: memberId,
    order_id: orderId,
    points: pointsToEarn,
    points_change: pointsToEarn,
    type: 'earn',
    description: 'สะสมจากการสั่งซื้อ Delivery #DEL#260714-3127'
  }).select();
  console.log("Insert result:", hist, insErr);
}

main();
