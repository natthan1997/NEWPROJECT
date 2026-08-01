require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Resetting all holiday approvals...");
  
  // 1. Reset all profiles accrued_holiday_days to 0
  const { error: pErr } = await supabase.from('profiles').update({ accrued_holiday_days: 0 }).neq('id', '00000000-0000-0000-0000-000000000000'); // match all
  if (pErr) console.error("Error resetting profiles:", pErr);
  else console.log("Profiles accrued_holiday_days reset to 0.");

  // 2. Reset all attendance_logs holiday_pay_status to 'pending'
  const { data: logsToReset, error: fetchErr } = await supabase
    .from('attendance_logs')
    .select('id')
    .not('holiday_pay_status', 'eq', 'pending')
    .not('holiday_pay_status', 'is', null);

  if (fetchErr) {
      console.error("Error fetching logs:", fetchErr);
  } else if (logsToReset && logsToReset.length > 0) {
      const ids = logsToReset.map(l => l.id);
      
      const { error: lErr } = await supabase
        .from('attendance_logs')
        .update({ holiday_pay_status: 'pending' })
        .in('id', ids);
        
      if (lErr) console.error("Error resetting logs:", lErr);
      else console.log(`Reset ${ids.length} attendance_logs to pending.`);
  } else {
      console.log("No logs to reset.");
  }

  console.log("Reset complete!");
}

run();
