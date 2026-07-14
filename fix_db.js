const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const missingId = '26df63a4-dc20-4a1b-8806-52727dac3ef4';
  
  // Let's get the branch id if needed, or just insert it with null branch.
  const { data, error } = await supabase.from('inventory_items').insert([
    {
      id: missingId,
      name: 'นมสด (Auto-recovered)',
      stock_quantity: 0,
      unit: 'ml',
      category: 'recovered',
      cost_per_unit: 0
    }
  ]);
  
  console.log("Insert recovered item:", data, error);
}
run();
