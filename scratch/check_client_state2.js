const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // wait, did the user get +2 points because it was claimed via QR code?
  // Let's check history again
  const { data: hist } = await supabase.from('pos_points_history').select('*').order('created_at', { ascending: false }).limit(5);
  console.log(hist);
}

main();
