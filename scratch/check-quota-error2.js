require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, quota_annual_leave').limit(1);
    if (!profiles || profiles.length === 0) return;
    const p = profiles[0];
    
    // Test update 0
    const { data, error } = await supabase.from('profiles').update({ quota_annual_leave: 0 }).eq('id', p.id).select();
    console.log("Update Error:", error);
    console.log("Update Data:", data);
}
check();
