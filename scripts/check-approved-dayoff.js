require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function run() {
  const { data, error } = await supabase.from('attendance_logs').select('id, profile_id, type, timestamp, holiday_pay_status').eq('holiday_pay_status', 'approved_dayoff');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Found ${data.length} records with approved_dayoff`);
  console.log(data);
  
  const { count } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('holiday_pay_status', 'approved_pay');
  console.log(`Count of approved_pay:`, count);
}
run();
