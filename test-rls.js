const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
// using anon key to simulate client fetch
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('pos_order_items').select('*').eq('status', 'cancelled').limit(5);
  console.log('Anon fetch:', data, error);
}
run();
