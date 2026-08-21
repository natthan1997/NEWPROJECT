const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    const tables = ['members', 'customers', 'member_checkins', 'loyalty_members'];
    for (const t of tables) {
        try {
            const { data, count, error } = await supabase.from(t).select('id', { count: 'exact' }).limit(1);
            if (!error && count !== null) {
                console.log(`Table ${t} count:`, count);
            }
        } catch(e) {}
    }
}
checkData();
