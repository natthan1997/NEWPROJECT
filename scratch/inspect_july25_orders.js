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

async function inspectJuly25Orders() {
  const targetBranchId = '1f3fc496-d89e-4323-a66e-4fcd555444e9';

  // Check orders updated/created between 2026-07-24T23:59:59Z and 2026-07-25T23:59:59Z
  const startISO = '2026-07-25T00:00:00.000Z';
  const endISO = '2026-07-25T23:59:59.999Z';

  const { data: todayOrders } = await supabase
    .from('pos_orders')
    .select('*')
    .gte('updated_at', startISO)
    .lte('updated_at', endISO)
    .in('status', ['paid', 'completed']);

  const branchTodayOrders = (todayOrders || []).filter(o => o.branch_id === targetBranchId);

  console.log(`=== ORDERS ON JULY 25, 2026 ===`);
  console.log(`Count of orders on July 25: ${branchTodayOrders.length}`);

  const todayRevenue = branchTodayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  console.log(`Gross Revenue on July 25: ${todayRevenue.toFixed(2)} THB`);

  // Fetch inventory
  const { data: invItems } = await supabase.from('inventory_items').select('id, cost_price').eq('branch_id', targetBranchId);
  const costMap = new Map((invItems || []).map(i => [i.id, i.cost_price || 0]));

  const calculateDynamicCost = (recipe_data) => {
    return (recipe_data || []).reduce((sum, ing) => {
      const cost = costMap.get(ing.ingredient_id) || 0;
      return sum + (cost * Number(ing.quantity || 0) * (ing.factor || 1));
    }, 0);
  };

  const orderIds = branchTodayOrders.map(o => o.id);
  let todayCogs = 0;

  if (orderIds.length > 0) {
    const { data: items } = await supabase.from('pos_order_items').select('*').in('order_id', orderIds);
    const { data: menuList } = await supabase.from('pos_menu_items').select('id, name, recipe_data');
    const { data: modifierList } = await supabase.from('pos_menu_modifiers').select('id, name, recipe_data');

    items?.forEach(item => {
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

      const lineCost = finalUnitCost * (item.quantity || 1);
      todayCogs += lineCost;

      const itemName = menuList?.find(m => m.id === item.item_id)?.name || item.name;
      console.log(`  Order Item: "${itemName}" x${item.quantity} | UnitCost: ${finalUnitCost.toFixed(2)} | SubtotalCost: ${lineCost.toFixed(2)}`);
    });
  }

  console.log(`\nTotal Calculated COGS for July 25: ${todayCogs.toFixed(2)} THB`);
}

inspectJuly25Orders();
