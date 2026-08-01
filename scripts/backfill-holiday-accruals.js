require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function run() {
  console.log("Starting backfill for accrued_holiday_days...");
  
  // Get all logs with approved_dayoff
  const { data: logs, error: logsError } = await supabase
    .from('attendance_logs')
    .select('profile_id')
    .eq('holiday_pay_status', 'approved_dayoff');

  if (logsError) {
    console.error("Error fetching logs:", logsError);
    process.exit(1);
  }

  // Count per profile
  const counts = {};
  for (const log of logs) {
    counts[log.profile_id] = (counts[log.profile_id] || 0) + 1;
  }
  
  console.log("Accrual counts to apply:", counts);

  // Update profiles
  for (const [profileId, count] of Object.entries(counts)) {
    console.log(`Updating profile ${profileId} to ${count} accrued days...`);
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ accrued_holiday_days: count })
        .eq('id', profileId);
        
    if (updateError) {
        console.error(`Error updating profile ${profileId}:`, updateError);
    }
  }

  console.log("Done.");
}

run();
