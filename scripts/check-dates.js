require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
async function run() {
  const { data } = await supabase.from('attendance_logs').select('timestamp, type').limit(100);
  console.log(data.map(d => d.timestamp));
}
run();
