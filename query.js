const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: memberCoupons } = await supabase.from('pos_member_coupons').select('*').limit(5);
  console.log('Member Coupons:', memberCoupons);
}
run();
