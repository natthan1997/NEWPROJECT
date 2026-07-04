const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  "https://cdjbzyrflzckjgxbqjqb.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: member } = await supabase.from('pos_members').select('*').limit(1).single();
  
  const { data, error } = await supabase.from('pos_points_history').insert({
    member_id: member.id, // we'll use UUID since the error earlier said "Failing row contains (UUID, line_user_id, ...)" wait... the row had UUID, line_user_id... so it has both?
    points_change: 50,
    type: 'earn',
    description: 'test'
  }).select();
  
  console.log("Insert result:", data, error);
}
check();
