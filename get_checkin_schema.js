const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function getCheckinSchema() {
    const res = await supabase.from('member_checkins').select('*').limit(1).catch(() => ({ data: [] }));
    if(res.data) {
        console.log("member_checkins columns:", Object.keys(res.data[0] || {}));
    } else {
        console.log("member_checkins error", res.error);
    }
}
getCheckinSchema();
