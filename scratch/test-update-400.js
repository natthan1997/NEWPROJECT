require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    // get a profile id
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    if (!profiles || profiles.length === 0) {
        console.log("No profiles found to test update.");
        return;
    }
    const pid = profiles[0].id;
    
    // Attempt the exact update from POSStaffManager
    const { error } = await supabase.from('profiles').update({
        quota_sick_leave: 30,
        quota_personal_leave: 3,
        quota_annual_leave: 0,
        quota_public_holiday: 13,
    }).eq('id', pid);
    
    console.log("Update Error:", error);
}
check();
