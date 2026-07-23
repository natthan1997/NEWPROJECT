const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  let query = supabase
    .from('pos_orders')
    .select('queue_number')
    .gte('created_at', startOfToday.toISOString())
    .eq('branch_id', '1f3fc496-d89e-4323-a66e-4fcd555444e9');

  const { data, error } = await query;
  console.log('Error:', error);
  console.log('Data count:', data ? data.length : 'N/A');
}

test();
