const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdjbzyrflzckjgxbqjqb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const { createClient } = require(path.join(process.cwd(), 'node_modules', '@supabase/supabase-js'));
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTwinings() {
  const { data: item } = await supabase.from('pos_menu_items').select('*, modifiers:pos_item_modifier_links(group_id)').eq('name', 'Twinning Hot Tea').single();
  console.log("Item:", item?.name, "Base Cost:", item?.cost_price);

  if (item?.modifiers && item.modifiers.length > 0) {
    const groupIds = item.modifiers.map(m => m.group_id);
    const { data: mods } = await supabase.from('pos_menu_modifiers').select('*').in('group_id', groupIds);
    console.log("\nBound Tea Modifiers:");
    mods.forEach(m => {
      console.log(`- Option: "${m.name}" | Recipe Data:`, JSON.stringify(m.recipe_data));
    });
  }
}

checkTwinings();
