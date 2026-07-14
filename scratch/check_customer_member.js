const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: latestOrder } = await supabase.from('pos_orders').select('*').order('created_at', { ascending: false }).limit(1).single();
  console.log("Latest order:", latestOrder.id, latestOrder.order_number, latestOrder.customer_id, latestOrder.line_user_id, latestOrder.order_source);
  
  if (latestOrder.customer_id) {
     const { data: member } = await supabase.from('pos_members').select('*').eq('id', latestOrder.customer_id).single();
     console.log("Customer member data:", member.id, member.line_user_id, member.points);
  } else if (latestOrder.line_user_id) {
     const { data: member } = await supabase.from('pos_members').select('*').eq('line_user_id', latestOrder.line_user_id).single();
     console.log("Line user member data:", member?.id, member?.line_user_id, member?.points);
  }
}

main();
