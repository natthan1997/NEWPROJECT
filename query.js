const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: campaigns } = await supabase.from('pos_loyalty_campaigns').select('*');
  console.log('Loyalty Campaigns:', campaigns);
}
run();
