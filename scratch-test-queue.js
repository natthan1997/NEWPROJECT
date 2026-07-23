const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayIso = startOfDay.toISOString();

  let queueQuery = supabase
    .from('pos_orders')
    .select('id, queue_number, order_number, shift_id, branch_id, created_at')
    .not('queue_number', 'is', null)
    .gte('created_at', startOfDayIso)
    .order('queue_number', { ascending: false })
    .limit(5);

  const result = await queueQuery;
  console.log("Latest orders today:", result.data);
}
test();
