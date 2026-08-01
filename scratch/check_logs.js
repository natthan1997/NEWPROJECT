const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('attendance_logs').select('id, profile_id, timestamp, checkout_zone_photos').eq('type', 'check_out').not('checkout_zone_photos', 'is', null).order('timestamp', { ascending: false }).limit(5);
  console.log(JSON.stringify(data, null, 2));
}
run();
