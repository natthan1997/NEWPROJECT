const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function getTrigger() {
    const res = await supabase.rpc('get_function_def', { func_name: 'assign_profile_codes' }).catch(() => null);
    console.log(res);
}
getTrigger();
