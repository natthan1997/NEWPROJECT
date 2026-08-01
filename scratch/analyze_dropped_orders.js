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

async function analyzeDroppedOrders() {
  const targetBranchId = '1f3fc496-d89e-4323-a66e-4fcd555444e9';
  const startISO = '2026-07-01T00:00:00.000Z';
  const endISO = '2026-07-24T23:59:59.999Z';

  // Fetch all orders up to July 24 in chronological order
  const { data: allOrders } = await supabase
    .from('pos_orders')
    .select('id, order_no, created_at, updated_at, total_amount')
    .gte('updated_at', startISO)
    .lte('updated_at', endISO)
    .in('status', ['paid', 'completed'])
    .order('created_at', { ascending: true });

  const branchOrders = (allOrders || []).filter(o => o.branch_id === targetBranchId);
  const totalOrdersCount = branchOrders.length;
  console.log(`Total branch orders (July 1-24): ${totalOrdersCount}`);

  // In Supabase REST API, when URL length limit is hit, PostgREST limits max query or drops IDs beyond limit (~450-500 IDs).
  // Let's check the items in the orders beyond 450 (the tail 163 orders that were dropped before chunking fix).
  const fetchedOrders = branchOrders.slice(0, 450);
  const droppedOrders = branchOrders.slice(450);

  console.log(`Included orders in old limited query: ${fetchedOrders.length}`);
  console.log(`Dropped orders beyond limit: ${droppedOrders.length}`);

  const droppedOrderIds = droppedOrders.map(o => o.id);

  // Fetch items for dropped orders
  let droppedItems = [];
  const chunkSize = 100;
  for (let i = 0; i < droppedOrderIds.length; i += chunkSize) {
    const chunk = droppedOrderIds.slice(i, i + chunkSize);
    const { data: itemsChunk } = await supabase.from('pos_order_items').select('*').in('order_id', chunk);
    if (itemsChunk) droppedItems = droppedItems.concat(itemsChunk);
  }

  // Fetch Inventory
  const { data: invItems } = await supabase.from('inventory_items').select('id, cost_price').eq('branch_id', targetBranchId);
  const costMap = new Map((invItems || []).map(i => [i.id, i.cost_price || 0]));

  const { data: menuList } = await supabase.from('pos_menu_items').select('id, name, recipe_data');
  const { data: modifierList } = await supabase.from('pos_menu_modifiers').select('id, name, recipe_data');
  const menuMap = new Map((menuList || []).map(m => [m.id, m]));

  const calculateDynamicCost = (recipe_data) => {
    return (recipe_data || []).reduce((sum, ing) => {
      const cost = costMap.get(ing.ingredient_id) || 0;
      return sum + (cost * Number(ing.quantity || 0) * (ing.factor || 1));
    }, 0);
  };

  let droppedCogsSum = 0;
  const droppedMenuSummary = {};

  droppedItems.forEach(item => {
    const menuDb = menuMap.get(item.item_id);
    const name = menuDb?.name || item.name || 'Unknown';
    const baseCost = calculateDynamicCost(menuDb?.recipe_data);

    let modifierCost = 0;
    if (item.selected_modifiers && Array.isArray(item.selected_modifiers)) {
      item.selected_modifiers.forEach(mod => {
        const modName = mod.name || mod.title || '';
        const modDb = modifierList?.find(m => m.name === modName || m.id === mod.id);
        if (modDb) modifierCost += calculateDynamicCost(modDb.recipe_data || []);
      });
    }

    const unitCost = baseCost + modifierCost > 0 ? baseCost + modifierCost : (Number(item.cost_price) || Number(menuDb?.cost_price) || 0);
    const lineCost = unitCost * Number(item.quantity || 1);
    droppedCogsSum += lineCost;

    if (!droppedMenuSummary[name]) droppedMenuSummary[name] = { qty: 0, cost: 0 };
    droppedMenuSummary[name].qty += Number(item.quantity || 1);
    droppedMenuSummary[name].cost += lineCost;
  });

  console.log(`\nTotal COGS of dropped orders: ${droppedCogsSum.toFixed(2)} THB`);
  console.log(`\n=== TOP DROPPED MENU ITEMS (THAT WERE MISSING BEFORE FIX) ===`);
  Object.entries(droppedMenuSummary)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 10)
    .forEach(([name, d]) => {
      console.log(`- ${name}: Missing ${d.qty} units | Total Cost: ${d.cost.toFixed(2)} THB`);
    });
}

analyzeDroppedOrders();
