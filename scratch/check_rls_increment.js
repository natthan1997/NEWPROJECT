const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const memberId = '36884b18-ed44-463e-8e19-c52aa9a0b8dc';
  
  // We'll increment by 0 to just check if it throws an error
  const { data, error } = await supabase.rpc('increment_member_points', {
    user_id: memberId,
    points_to_add: 0,
  });
  console.log("Anon rpc increment_member_points:");
  console.log("Data:", data);
  console.log("Error:", error);
}

main();
