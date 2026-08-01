require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Syncing accrued holiday balances...");
  
  // 1. Find all logs with approved_dayoff
  const { data: logs, error: lErr } = await supabase.from('attendance_logs').select('profile_id').eq('holiday_pay_status', 'approved_dayoff');

  if (lErr) {
    console.error(lErr);
    process.exit(1);
  }

  // 2. Count them per profile
  const counts = {};
  for (const log of logs) {
      counts[log.profile_id] = (counts[log.profile_id] || 0) + 1;
  }

  console.log("Counts to apply:", counts);

  // 3. Update profiles
  let updated = 0;
  for (const [profileId, count] of Object.entries(counts)) {
    const { error } = await supabase.from('profiles').update({ accrued_holiday_days: count }).eq('id', profileId);
    if (!error) updated++;
  }

  console.log(`Updated ${updated} profiles with correct balances.`);
}

run();
