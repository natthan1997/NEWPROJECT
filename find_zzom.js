require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: profile } = await supabase.from('profiles').select('*').ilike('display_name', '%zzom%').single();
    if (!profile) return console.log("Not found");
    console.log("Zzom ID:", profile.id);
    
    const { data: logs } = await supabase.from('attendance_logs').select('*').eq('profile_id', profile.id).eq('holiday_pay_status', 'approved_dayoff');
    console.log("Approved dayoffs for Zzom:");
    logs.forEach(l => {
        const d = new Date(l.timestamp);
        console.log(`- ${l.id} on ${d.toISOString()} (Month: ${d.getMonth() + 1})`);
    });
}
run();
