const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { count } = await supabase
    .from('pos_attendance')
    .select('id, profiles!inner(staff_type)', { count: 'exact', head: true })
    .is('check_out_at', null)
    .eq('status', 'active')
    .eq('profiles.staff_type', 'rider');
  console.log('Active riders:', count);
}
run();
