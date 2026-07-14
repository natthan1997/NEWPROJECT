const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const memberId = '36884b18-ed44-463e-8e19-c52aa9a0b8dc';
  
  // Test RLS on pos_points_history insert with ANON key
  const { data, error } = await supabase.from('pos_points_history').insert({
    member_id: memberId,
    order_id: null,
    points: 1,
    points_change: 1,
    type: 'earn',
    description: 'Test RLS again'
  });
  
  console.log("Anon insert error:", error);
}

main();
