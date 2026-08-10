const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('pos_member_checkins').insert({
    order_id: '1f3fc496-d89e-4323-a66e-4fcd555444e9',
    status: 'pending',
    line_user_id: 'U12345'
  }).select();
  console.log(error || 'Success');
}
run();
