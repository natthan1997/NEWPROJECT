const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  "https://cdjbzyrflzckjgxbqjqb.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: member } = await supabase.from('pos_members').select('*').limit(1).single();
  if (!member) {
    console.log("No member found");
    return;
  }
  
  console.log("Member found, ID:", member.id, "LINE:", member.line_user_id);
  
  // Try inserting with line_user_id
  const { data, error } = await supabase.from('pos_points_history').insert({
    member_id: member.line_user_id,
    points: 50,
    type: 'earn',
    description: 'test'
  }).select();
  
  console.log("Insert with line_user_id result:", data, error);
  
  // Try inserting with UUID
  const { data2, error2 } = await supabase.from('pos_points_history').insert({
    member_id: member.id,
    points: 50,
    type: 'earn',
    description: 'test'
  }).select();
  
  console.log("Insert with UUID result:", data2, error2);
}
check();
