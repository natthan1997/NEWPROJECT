const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function getProfileSchema() {
    const res = await supabase.from('profiles').select('*').limit(1);
    if(res.data && res.data.length > 0) {
        console.log(Object.keys(res.data[0]));
    } else {
        console.log("No data, try using postgres directly if possible");
    }
}
getProfileSchema();
