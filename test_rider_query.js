const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, count, error } = await supabase
    .from('pos_attendance')
    .select('id, profiles!inner(staff_type)', { count: 'exact' })
    .is('check_out_at', null)
    .eq('status', 'active')
    .eq('profiles.staff_type', 'rider');
  console.log('Error:', error);
  console.log('Count:', count);
  console.log('Data:', data);
}
run();
