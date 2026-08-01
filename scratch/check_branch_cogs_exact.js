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

async function checkBranchCogsExact() {
  const targetBranchId = '1f3fc496-d89e-4323-a66e-4fcd555444e9';
  const startISO = '2026-07-01T00:00:00.000Z';
  const endISO = '2026-07-31T23:59:59.999Z';

  // Fetch orders for this branch
  const { data: allOrders } = await supabase
    .from('pos_orders')
    .select('*')
    .gte('updated_at', startISO)
    .lte('updated_at', endISO)
    .in('status', ['paid', 'completed']);

  const branchOrders = (allOrders || []).filter(o => o.branch_id === targetBranchId);
  console.log(`Branch orders count: ${branchOrders.length}`);

  // Fetch inventory for this branch
  const { data: invItems } = await supabase
    .from('inventory_items')
    .select('id, cost_price')
    .eq('branch_id', targetBranchId);

  console.log(`Branch inventory items count: ${invItems?.length}`);
  const costMap = new Map((invItems || []).map(i => [i.id, i.cost_price || 0]));

  const calculateDynamicCost = (recipe_data) => {
    return (recipe_data || []).reduce((sum, ing) => {
      const cost = costMap.get(ing.ingredient_id) || 0;
      return sum + (cost * Number(ing.quantity || 0) * (ing.factor || 1));
    }, 0);
  };

  const orderIds = branchOrders.map(o => o.id);
  let actualCogsBranch = 0;

  if (orderIds.length > 0) {
    const chunkSize = 100;
    let items = [];
    for (let i = 0; i < orderIds.length; i += chunkSize) {
      const chunk = orderIds.slice(i, i + chunkSize);
      const { data: itemsChunk } = await supabase.from('pos_order_items').select('*').in('order_id', chunk);
      if (itemsChunk) items = items.concat(itemsChunk);
    }

    const { data: menuList } = await supabase.from('pos_menu_items').select('id, name, recipe_data');
    const { data: modifierList } = await supabase.from('pos_menu_modifiers').select('id, name, recipe_data');

    items.forEach(item => {
      const menuRecipe = menuList?.find(m => m.id === item.item_id)?.recipe_data || [];
      const baseCost = calculateDynamicCost(menuRecipe);
      let modifierCost = 0;

      if (item.selected_modifiers && Array.isArray(item.selected_modifiers)) {
        item.selected_modifiers.forEach(mod => {
          const modName = mod.name || mod.title || 'Unknown';
          const modDb = modifierList?.find(m => m.name === modName || m.id === mod.id);
          if (modDb) {
            modifierCost += calculateDynamicCost(modDb.recipe_data || []);
          }
        });
      }

      const dynamicUnitCost = baseCost + modifierCost;
      const finalUnitCost = dynamicUnitCost > 0 ? dynamicUnitCost : (Number(item.cost_price) || 0);

      actualCogsBranch += finalUnitCost * (item.quantity || 1);
    });
  }

  console.log(`EXACT BRANCH COGS AS SET IN SYSTEM: ${actualCogsBranch.toFixed(2)} THB`);
}

checkBranchCogsExact();
