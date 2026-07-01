require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: shop } = await supabase.from('pos_shop_settings').select('branch_id').limit(1);
  const { data: cats } = await supabase.from('pos_menu_categories').select('id, name, branch_id');
  const { data: items } = await supabase.from('pos_menu_items').select('id, name, branch_id').limit(2);
  console.log("Shop branch_id:", shop?.[0]?.branch_id);
  console.log("Categories branch_ids:", cats?.map(c => c.branch_id));
  console.log("Categories count:", cats?.length);
  console.log("Items branch_ids:", items?.map(i => i.branch_id));
}
run();
