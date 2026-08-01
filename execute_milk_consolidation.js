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

const TARGET_MILK_ID = '076ae5e6-071e-43d0-af8a-5dc8923f2651'; // นมสด MEJI
const OLD_MILK_ID = '26df63a4-dc20-4a1b-8806-52727dac3ef4'; // นมสด (Auto-recovered)

async function consolidateMilk() {
  console.log("=== EXECUTING OPTION 1: CONSOLIDATING FRESH MILK INGREDIENTS ===");

  // 1. Fetch inventory items for cost calculation
  const { data: invItems, error: invErr } = await supabase.from('inventory_items').select('id, name, cost_price');
  if (invErr) {
    console.error("Error fetching inventory items:", invErr);
    return;
  }

  const invCostMap = new Map((invItems || []).map(i => [i.id, Number(i.cost_price || 0)]));
  // Ensure target milk has 0.05 cost
  invCostMap.set(TARGET_MILK_ID, 0.05);

  // 2. Fetch all menu items
  const { data: menuItems, error: menuErr } = await supabase.from('pos_menu_items').select('*');
  if (menuErr) {
    console.error("Error fetching menu items:", menuErr);
    return;
  }

  let updatedMenuCount = 0;

  for (const item of menuItems) {
    let hasOldMilk = false;
    const currentRecipe = item.recipe_data || [];

    const newRecipe = currentRecipe.map(ing => {
      if (ing.ingredient_id === OLD_MILK_ID) {
        hasOldMilk = true;
        return {
          ...ing,
          ingredient_id: TARGET_MILK_ID,
          name: 'นมสด MEJI'
        };
      }
      return ing;
    });

    if (hasOldMilk) {
      // Recalculate total menu cost
      const newTotalCost = newRecipe.reduce((sum, ing) => {
        const cost = invCostMap.get(ing.ingredient_id) || 0;
        return sum + (cost * Number(ing.quantity || 0) * Number(ing.factor || 1));
      }, 0);

      const { error: updateErr } = await supabase
        .from('pos_menu_items')
        .update({
          recipe_data: newRecipe,
          cost_price: newTotalCost
        })
        .eq('id', item.id);

      if (updateErr) {
        console.error(`Failed to update menu ${item.name}:`, updateErr);
      } else {
        updatedMenuCount++;
        console.log(`✅ Updated menu: "${item.name}" | New Cost: ฿${newTotalCost.toFixed(2)}`);
      }
    }
  }

  // 3. Update any modifiers referencing old milk ID
  const { data: modifiers } = await supabase.from('pos_menu_modifiers').select('*');
  let updatedModCount = 0;

  for (const mod of modifiers || []) {
    let hasOldMilk = false;
    const currentRecipe = mod.recipe_data || [];

    const newRecipe = currentRecipe.map(ing => {
      if (ing.ingredient_id === OLD_MILK_ID || ing.substitute_target_id === OLD_MILK_ID) {
        hasOldMilk = true;
        return {
          ...ing,
          ingredient_id: ing.ingredient_id === OLD_MILK_ID ? TARGET_MILK_ID : ing.ingredient_id,
          substitute_target_id: ing.substitute_target_id === OLD_MILK_ID ? TARGET_MILK_ID : ing.substitute_target_id,
          substitute_target_name: 'นมสด MEJI',
          name: ing.ingredient_id === OLD_MILK_ID ? 'นมสด MEJI' : ing.name
        };
      }
      return ing;
    });

    if (hasOldMilk) {
      await supabase.from('pos_menu_modifiers').update({ recipe_data: newRecipe }).eq('id', mod.id);
      updatedModCount++;
      console.log(`✅ Updated modifier: "${mod.name}"`);
    }
  }

  // 4. Delete the duplicate OLD_MILK_ID from inventory_items
  const { error: deleteErr } = await supabase.from('inventory_items').delete().eq('id', OLD_MILK_ID);
  if (deleteErr) {
    console.log("Could not delete old inventory item (deactivating instead):", deleteErr.message);
    await supabase.from('inventory_items').update({ name: 'นมสด (ยกเลิก - ย้ายไป MEJI)' }).eq('id', OLD_MILK_ID);
  } else {
    console.log("🗑️ Successfully deleted duplicate 'นมสด (Auto-recovered)' from inventory_items!");
  }

  console.log(`\n================ SUMMARY ================`);
  console.log(`Total Menu Items Updated to 'นมสด MEJI': ${updatedMenuCount}`);
  console.log(`Total Modifiers Updated: ${updatedModCount}`);
}

consolidateMilk();
