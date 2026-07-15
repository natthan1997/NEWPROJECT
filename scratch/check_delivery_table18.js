const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: member } = await supabase.from('pos_members').select('id, line_user_id, phone, points').eq('id', '36884b18-ed44-463e-8e19-c52aa9a0b8dc').single();
  console.log("Member:", member);
  
  const { data: order } = await supabase.from('pos_orders').select('customer_id, line_user_id, reference_name').eq('id', 'fb61ab13-c3c7-4c25-84ed-f33d9ca3aee6').single();
  console.log("Order 3127:", order);
}

main();
