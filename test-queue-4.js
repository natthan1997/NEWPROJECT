const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('pos_orders')
    .select('queue_number')
    .not('queue_number', 'is', null)
    .gte('created_at', startOfDay.toISOString())
    .eq('shift_id', '1c2e29ba-4162-467f-b93a-29c9a52322fb')
    .order('queue_number', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  console.log('Error:', error);
  console.log('Data:', data);
  console.log('Type of queue_number:', data ? typeof data.queue_number : 'N/A');
}

test();
