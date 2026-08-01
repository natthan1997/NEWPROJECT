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

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function checkRecipeUUIDs() {
  console.log("=== CHECKING FOR NON-UUID INGREDIENT IDs IN RECIPES ===");
  const { data: menuItems } = await supabase.from('pos_menu_items').select('id, name, recipe_data');
  const { data: modifiers } = await supabase.from('pos_menu_modifiers').select('id, name, recipe_data');

  const badItems = [];

  menuItems?.forEach(item => {
    (item.recipe_data || []).forEach(ing => {
      if (ing.ingredient_id && !uuidRegex.test(ing.ingredient_id)) {
        badItems.push({ type: 'Menu Item', name: item.name, ingName: ing.name, badId: ing.ingredient_id });
      }
    });
  });

  modifiers?.forEach(mod => {
    (mod.recipe_data || []).forEach(ing => {
      if (ing.ingredient_id && !uuidRegex.test(ing.ingredient_id)) {
        badItems.push({ type: 'Modifier', name: mod.name, ingName: ing.name, badId: ing.ingredient_id });
      }
    });
  });

  console.log("Non-UUID Recipe Ingredients Found:", badItems);
}

checkRecipeUUIDs();
