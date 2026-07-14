const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await supabase
    .from('pos_shop_settings')
    .select('opening_hours')
    .limit(1)
    .single();
  
  console.log(JSON.stringify(data, null, 2));
}

main();
