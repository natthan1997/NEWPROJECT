const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await supabase
    .from('pos_shop_settings')
    .select('opening_hours')
    .limit(1)
    .single();
  
  console.log("Earn THB:", data.opening_hours.loyalty_earn_thb);
  console.log("Earn Rate:", data.opening_hours.loyalty_earn_rate);
}

main();
