const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Let's check if they used POSTerminal's checkout by checking if `points_earned` is normally updated there.
  // Actually, I can check pos_points_history to see if there's any history at all for 3127
  const { data: hist } = await supabase.from('pos_points_history').select('*').eq('order_id', 'fb61ab13-c3c7-4c25-84ed-f33d9ca3aee6');
  console.log("History:", hist);
}

main();
