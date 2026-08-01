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

async function inspectModifiers() {
  console.log("=== INSPECTING POS MODIFIERS ===");
  const { data: modifierList } = await supabase.from('pos_menu_modifiers').select('*');
  const { data: invItems } = await supabase.from('inventory_items').select('*');
  const invMap = new Map((invItems || []).map(i => [i.id, i]));

  console.log(`Total modifiers in database: ${modifierList?.length}`);

  (modifierList || []).forEach(mod => {
    console.log(`\nModifier: "${mod.name}" | Price: ${mod.price || 0} THB | Stated Cost: ${mod.cost_price || 0} THB`);
    if (Array.isArray(mod.recipe_data) && mod.recipe_data.length > 0) {
      console.log(`  Recipe Data (${mod.recipe_data.length}):`);
      mod.recipe_data.forEach(ing => {
        const inv = invMap.get(ing.ingredient_id);
        const unitCost = Number(inv?.cost_price || 0);
        const qty = Number(ing.quantity || 0) * Number(ing.factor || 1);
        const ingCost = unitCost * qty;
        console.log(`    - ${inv?.name || ing.name || 'Unknown'} (${ing.ingredient_id}): Qty ${qty} @ ${unitCost} THB = ${ingCost.toFixed(2)} THB`);
      });
    } else {
      console.log(`  Recipe Data: NONE`);
    }
  });
}

inspectModifiers();
