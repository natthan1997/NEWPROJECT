require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: logs, error } = await supabase.from('attendance_logs').select('*').eq('holiday_pay_status', 'pending');
    if (error) {
        console.error("Error fetching logs:", error);
        return;
    }
    
    console.log(`Found ${logs.length} pending holiday logs.`);
    
    for (let log of logs) {
        const { data: profile } = await supabase.from('profiles').select('accrued_holiday_days, holiday_compensation_type').eq('id', log.profile_id).single();
        
        let newStatus = profile.holiday_compensation_type === 'dayoff' ? 'approved_dayoff' : 'approved_pay';
        let currentBalance = Number(profile.accrued_holiday_days) || 0;
        
        if (newStatus === 'approved_dayoff') {
            currentBalance += 1;
        }
        
        await supabase.from('attendance_logs').update({ holiday_pay_status: newStatus }).eq('id', log.id);
        
        if (newStatus === 'approved_dayoff') {
            await supabase.from('profiles').update({ accrued_holiday_days: currentBalance }).eq('id', log.profile_id);
        }
        
        console.log(`Approved log ${log.id} for profile ${log.profile_id} as ${newStatus}`);
    }
    
    console.log("Done.");
}

run();
