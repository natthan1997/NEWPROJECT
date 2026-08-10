const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: member } = await supabase.from('pos_members').select('*').eq('phone', '+66648033219').single();
  console.log("Member:", member.id);
  const { data: coupons } = await supabase.from('pos_member_coupons').select('*').eq('member_id', member.id);
  console.log("Coupons:", coupons);
}
run();
