const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.rpc('increment_member_points', {
    user_id: '36884b18-ed44-463e-8e19-c52aa9a0b8dc',
    points_to_add: 1,
  })
  console.log("Error:", error);
  
  // check if points actually changed
  const { data: member } = await supabase.from('pos_members').select('points').eq('id', '36884b18-ed44-463e-8e19-c52aa9a0b8dc').single();
  console.log("Member points:", member?.points);
}

main();
