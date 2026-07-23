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
    .select('id, queue_number, created_at')
    .not('queue_number', 'is', null)
    .gte('created_at', startOfDay.toISOString())
    .order('queue_number', { ascending: false });
    
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
