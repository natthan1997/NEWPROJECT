const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    // Check profiles count
    const p = await supabase.from('profiles').select('id', { count: 'exact' });
    console.log("Profiles count:", p.count);
    
    // Let's guess other tables
    const tables = ['members', 'customers', 'member_checkins', 'pos_member_checkins', 'loyalty_members'];
    for (const t of tables) {
        const res = await supabase.from(t).select('id', { count: 'exact' }).limit(1).catch(() => null);
        if (res && res.count !== null) {
            console.log(`Table ${t} count:`, res.count);
        }
    }
}
checkData();
