const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const missingId = '26df63a4-dc20-4a1b-8806-52727dac3ef4';
  
  const { data, error } = await supabase.from('inventory_items').insert([
    {
      id: missingId,
      name: 'นมสด (Auto-recovered)',
      stock_quantity: 0,
      unit: 'ml',
      cost_price: 0,
      branch_id: '1f3fc496-d89e-4323-a66e-4fcd555444e9'
    }
  ]);
  
  console.log("Insert recovered item:", data, error);
}
run();
