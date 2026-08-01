const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectRecipes() {
  const { data: menuList } = await supabase.from('pos_menu_items').select('*');
  const { data: invItems } = await supabase.from('inventory_items').select('*');
  const invMap = new Map((invItems || []).map(i => [i.id, i]));

  console.log("=== TOP MENU ITEMS RECIPE & COST INSPECTION ===");

  (menuList || []).forEach(m => {
    console.log(`\nMenu: "${m.name}" | Category: ${m.category} | Price: ${m.price} THB | Fixed Cost: ${m.cost_price} THB`);
    if (Array.isArray(m.recipe_data) && m.recipe_data.length > 0) {
      console.log(`  Recipe Ingredients (${m.recipe_data.length}):`);
      let totalRecipeCost = 0;
      m.recipe_data.forEach(ing => {
        const inv = invMap.get(ing.ingredient_id);
        const unitCost = Number(inv?.cost_price || 0);
        const qty = Number(ing.quantity || 0) * Number(ing.factor || 1);
        const itemCost = unitCost * qty;
        totalRecipeCost += itemCost;
        console.log(`    - ${inv?.name || 'Unknown'} (${ing.ingredient_id}): Qty ${ing.quantity} ${inv?.unit || ''} @ ${unitCost} THB/unit = ${itemCost.toFixed(2)} THB`);
      });
      console.log(`  => Total Recipe Calculated Unit Cost: ${totalRecipeCost.toFixed(2)} THB`);
    } else {
      console.log(`  Recipe: NONE (Using Fixed Cost: ${m.cost_price || 0} THB)`);
    }
  });
}

inspectRecipes();
