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

async function checkMilkItems() {
  console.log("=== INVENTORY ITEMS WITH 'นม' ===");
  const { data: invItems } = await supabase.from('inventory_items').select('*').ilike('name', '%นม%');
  console.log(JSON.stringify(invItems, null, 2));

  console.log("\n=== POS MENU ITEMS WITH 'นม' ===");
  const { data: menuItems } = await supabase.from('pos_menu_items').select('*').ilike('name', '%นม%');
  console.log(JSON.stringify(menuItems, null, 2));
}

checkMilkItems();
