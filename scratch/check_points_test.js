const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: member } = await supabase.from('pos_members').select('id').eq('line_user_id', 'U5dc61bfebbeea5efed07f0847ff92371').single();
  const payload = {
    order_action: 'insert',
    order: {
      order_number: 'TEST-POINTS-2',
      customer_id: member.id,
      total_amount: 150,
      net_total: 150,
      status: 'completed',
    },
    member_id: member.id,
    points_earned: 1,
    points_history: [{
      points: 1,
      points_change: 1,
      type: 'earn',
      description: 'Test POS RPC'
    }]
  };
  
  const { data, error } = await supabase.rpc('pos_checkout_order', { payload });
  console.log("RPC Error:", error);
  console.log("RPC Data:", data);
}

main();
