require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
async function run() {
  const { data, count } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true });
  console.log('Count:', count);
}
run();
