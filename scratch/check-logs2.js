require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data, error, count } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .in('holiday_pay_status', ['approved_pay', 'approved_dayoff']);
    console.log("Count:", count);
    console.log("Error:", error);
}
check();
