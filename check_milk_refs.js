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

async function checkReferences() {
  const { data: menuItems } = await supabase.from('pos_menu_items').select('id, name, recipe_data');
  const mejiRefs = [];
  const autoRecoveredRefs = [];

  menuItems.forEach(item => {
    const recipes = item.recipe_data || [];
    recipes.forEach(ing => {
      if (ing.ingredient_id === '076ae5e6-071e-43d0-af8a-5dc8923f2651') {
        mejiRefs.push({ menu: item.name, ing: ing.name });
      }
      if (ing.ingredient_id === '26df63a4-dc20-4a1b-8806-52727dac3ef4') {
        autoRecoveredRefs.push({ menu: item.name, ing: ing.name });
      }
    });
  });

  console.log("=== MENUS REFERENCING 'นมสด MEJI' (Cost = ฿0.05) ===");
  console.table(mejiRefs);

  console.log("\n=== MENUS REFERENCING 'นมสด (Auto-recovered)' (Cost = ฿0.00) ===");
  console.table(autoRecoveredRefs);
}

checkReferences();
