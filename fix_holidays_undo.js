require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Holidays = require('date-holidays');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const hd = new Holidays('TH');

async function run() {
    console.log("Reverting all holiday quotas to 0...");
    await supabase.from('profiles').update({ accrued_holiday_days: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log("Setting all holiday_pay_status to pending...");
    await supabase.from('attendance_logs').update({ holiday_pay_status: 'pending' }).neq('id', '00000000-0000-0000-0000-000000000000');

    const { data: logs, error } = await supabase.from('attendance_logs').select('*').order('created_at', { ascending: true });
    if (error) return console.error(error);
    
    console.log(`Processing ${logs.length} logs for actual holidays...`);
    
    let profileQuotas = {};

    for (let log of logs) {
        if (!log.date) continue; // skip invalid dates
        
        const dateObj = new Date(log.date);
        if (isNaN(dateObj.getTime())) continue; // skip invalid dates

        const year = dateObj.getFullYear();
        const holidays = hd.getHolidays(year);
        
        const logDateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(dateObj);
        
        const isHoliday = holidays.some(h => h.date.split(' ')[0] === logDateStr);
        
        if (isHoliday) {
            const { data: profile } = await supabase.from('profiles').select('holiday_compensation_type').eq('id', log.profile_id).single();
            if (!profile) continue;

            let newStatus = profile.holiday_compensation_type === 'dayoff' ? 'approved_dayoff' : 'approved_pay';
            
            // To prevent double counting same day for same profile
            const profileKey = `${log.profile_id}_${logDateStr}`;
            if (!profileQuotas[profileKey]) {
                profileQuotas[profileKey] = true;
                
                if (newStatus === 'approved_dayoff') {
                    const { data: currProfile } = await supabase.from('profiles').select('accrued_holiday_days').eq('id', log.profile_id).single();
                    let currentBalance = Number(currProfile.accrued_holiday_days) || 0;
                    await supabase.from('profiles').update({ accrued_holiday_days: currentBalance + 1 }).eq('id', log.profile_id);
                }
            }

            await supabase.from('attendance_logs').update({ holiday_pay_status: newStatus }).eq('id', log.id);
            console.log(`Approved log ${log.id} on actual holiday ${logDateStr} as ${newStatus}`);
        }
    }
    
    console.log("Fix completed.");
}

run();
