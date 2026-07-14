const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const itemId = '098a75d7-052a-49af-8b13-8a6795efcd8d';
  
  const { data: invItem } = await supabase.from('inventory_items').select('*').eq('id', itemId).maybeSingle();
  const { data: posItem } = await supabase.from('pos_menu_items').select('*').eq('id', itemId).maybeSingle();
  
  console.log("In inventory_items:", !!invItem);
  console.log("In pos_menu_items:", !!posItem);
}
run();
