const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: checkins } = await supabase.from('pos_member_checkins').select('*').eq('line_user_id', 'U5dc61bfebbeea5efed07f0847ff92371').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Checkins:', checkins);
}
check();
