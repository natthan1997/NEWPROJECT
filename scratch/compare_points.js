const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const memberId = '36884b18-ed44-463e-8e19-c52aa9a0b8dc';
  
  // 1. Get member's points column
  const { data: member } = await supabase.from('pos_members').select('points').eq('id', memberId).single();
  console.log("Points in pos_members:", member.points);
  
  // 2. Sum points_change in pos_points_history
  const { data: history } = await supabase.from('pos_points_history').select('points_change').eq('member_id', memberId);
  const sumHistory = history.reduce((sum, item) => sum + item.points_change, 0);
  console.log("Sum of points_change in history:", sumHistory);
  console.log("History records count:", history.length);
}

main();
