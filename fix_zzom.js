require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: profile } = await supabase.from('profiles').select('*').ilike('display_name', '%zzom%').single();
    if (!profile) return console.log("Not found");
    console.log(`Zzom ID: ${profile.id}, Current Quota: ${profile.accrued_holiday_days}`);
    
    // Find May logs
    const { data: logs } = await supabase.from('attendance_logs').select('*').eq('profile_id', profile.id).eq('holiday_pay_status', 'approved_dayoff');
    
    let toReject = [];
    logs.forEach(l => {
        const d = new Date(l.timestamp);
        if (d.getMonth() + 1 < 6) { // Before June (Month 1-5)
            toReject.push(l.id);
        }
    });
    
    if (toReject.length > 0) {
        console.log(`Rejecting ${toReject.length} logs from before June...`);
        // We only decrement the quota by the NUMBER OF UNIQUE DAYS, not the number of logs.
        // Wait, my previous script incremented once per unique day!
        // Let's just recalculate Zzom's quota from scratch based on June onwards.
        
        // Count unique days from June onwards
        let validDays = new Set();
        logs.forEach(l => {
            const d = new Date(l.timestamp);
            if (d.getMonth() + 1 >= 6) {
                const dateStr = d.toISOString().split('T')[0];
                validDays.add(dateStr);
            }
        });
        
        console.log(`Zzom should have ${validDays.size} days from June onwards.`);
        
        await supabase.from('attendance_logs').update({ holiday_pay_status: 'rejected' }).in('id', toReject);
        await supabase.from('profiles').update({ accrued_holiday_days: validDays.size }).eq('id', profile.id);
        
        console.log("Fixed Zzom.");
    } else {
        console.log("No logs to reject.");
    }
}
run();
