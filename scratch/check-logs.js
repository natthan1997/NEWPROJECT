require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data } = await supabase
        .from('attendance_logs')
        .select('id, profile_id, holiday_pay_status, timestamp, action_type')
        .not('holiday_pay_status', 'is', null);
    console.log("All logs with holiday_pay_status:");
    console.log(data);
    
    const { data: q2 } = await supabase
        .from('profiles')
        .select('id, first_name, accrued_holiday_days')
        .gt('accrued_holiday_days', 0);
    console.log("Profiles with accrued > 0:", q2);
}
check();
