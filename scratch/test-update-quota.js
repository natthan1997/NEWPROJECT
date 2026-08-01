require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name, quota_annual_leave').limit(1);
    const p = profiles[0];
    console.log("Before:", p);
    
    // Update to 0
    await supabase.from('profiles').update({ quota_annual_leave: 0 }).eq('id', p.id);
    
    // Read back
    const { data: profilesAfter } = await supabase.from('profiles').select('id, display_name, quota_annual_leave').eq('id', p.id);
    console.log("After:", profilesAfter[0]);
}
check();
