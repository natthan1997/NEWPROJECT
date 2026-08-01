require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('attendance_logs').select('id, profile_id, timestamp, holiday_pay_status').gte('timestamp', '2026-05-04T00:00:00Z').lte('timestamp', '2026-05-04T23:59:59Z');
  console.log(data);
}
run();
