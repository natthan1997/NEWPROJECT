const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: items } = await supabase.from('pos_menu_items').select('*').ilike('name', '%โกโก้%');
  console.log("Found cocoa items:", items?.length);
  if (items && items.length > 0) {
    console.log("Recipe data:", items[0].recipe_data);
  }
}
run();
