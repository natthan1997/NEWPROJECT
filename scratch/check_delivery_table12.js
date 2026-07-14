const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: pay } = await supabase.from('pos_points_history').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Recent history:");
  console.log(pay);
  
  const { data: member } = await supabase.from('pos_members').select('points').eq('id', '36884b18-ed44-463e-8e19-c52aa9a0b8dc').single();
  console.log("Current Points:", member.points);
}

main();
