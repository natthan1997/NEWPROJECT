const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: tokens } = await supabase.from('pos_qr_reward_tokens').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Tokens:', tokens);
}
check();
