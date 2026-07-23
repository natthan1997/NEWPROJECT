const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('pos_orders')
    .select('id, queue_number, created_at, order_source')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log('Error:', error);
  console.log('Recent 10 orders:', data);
}

check();
