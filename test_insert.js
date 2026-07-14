const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const itemId = '098a75d7-052a-49af-8b13-8a6795efcd8d';
  
  // try inserting a dummy movement
  const { data, error } = await supabase.from('inventory_movements').insert([
    {
      item_id: itemId,
      change_amount: 0,
      new_quantity: 0,
      reason: 'test',
      reference_id: 'test'
    }
  ]);
  
  console.log("Insert result:", data, error);
}
run();
