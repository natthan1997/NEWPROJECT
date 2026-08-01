require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('attendance_logs').select('id, profile_id, holiday_pay_status, type, timestamp').not('holiday_pay_status', 'is', null);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Found ${data.length} records with non-null holiday_pay_status`);
  console.log(data);
}
run();
