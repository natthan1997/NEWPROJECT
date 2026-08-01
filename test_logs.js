require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data: logs } = await supabase.from('attendance_logs').select('id, date, created_at').order('created_at', { ascending: false }).limit(5);
    console.log(logs);
}
run();
