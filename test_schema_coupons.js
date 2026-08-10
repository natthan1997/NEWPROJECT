const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('pos_member_coupons').select('status');
  const statuses = new Set(data?.map(d => d.status) || []);
  console.log(Array.from(statuses));
}
run();
