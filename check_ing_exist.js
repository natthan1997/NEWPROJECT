const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const ids = [
    'a929231b-5846-4fe6-b61e-5fd988948fb2',
    '26df63a4-dc20-4a1b-8806-52727dac3ef4',
    '6b32058e-be58-470d-868d-068b6b85c8b0',
    '3f3c9c58-cf6f-4e53-aca1-efda720a5442',
    'bb02bfab-8538-4103-a493-c5c0292c9772',
    '90ed532e-537e-4309-8e3f-dcea99f6fb7a',
    'd63ae383-f5b8-4c27-9939-19f5fe78b03b',
    '7679f1c2-bd58-446a-9ce7-8767745f33be',
    '488af5bd-b367-4f3d-8d60-056207c73861'
  ];
  
  const { data, error } = await supabase.from('inventory_items').select('id').in('id', ids);
  const foundIds = data.map(d => d.id);
  const missing = ids.filter(id => !foundIds.includes(id));
  
  console.log("Missing IDs:", missing);
}
run();
