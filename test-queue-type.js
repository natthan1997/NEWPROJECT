const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('pos_orders')
    .select('id, queue_number')
    .not('queue_number', 'is', null)
    .limit(10);
    
  console.log('Error:', error);
  if (data) {
    data.forEach(r => {
      console.log(`id: ${r.id}, queue_number: ${r.queue_number}, typeof: ${typeof r.queue_number}`);
    });
  }
}

test();
