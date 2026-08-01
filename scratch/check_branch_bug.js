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

async function checkBranchBug() {
  const targetBranchId = '1f3fc496-d89e-4323-a66e-4fcd555444e9';
  console.log(`=== CHECKING BRANCH BUG FOR branch_id: ${targetBranchId} ===`);

  const { data: branch } = await supabase.from('branches').select('*').eq('id', targetBranchId).single();
  console.log("Branch Info:", branch);

  const { data: invItemsAll } = await supabase.from('inventory_items').select('id, name, branch_id, branch_code, cost_price');
  console.log(`Total inventory_items: ${invItemsAll.length}`);

  const invByBranchId = invItemsAll.filter(i => i.branch_id === targetBranchId);
  const invByBranchCode = invItemsAll.filter(i => branch && i.branch_code === branch.branch_code);
  const invNullBranch = invItemsAll.filter(i => !i.branch_id && !i.branch_code);

  console.log(`inventory_items matching branch_id ${targetBranchId}: ${invByBranchId.length}`);
  console.log(`inventory_items matching branch_code ${branch?.branch_code}: ${invByBranchCode.length}`);
  console.log(`inventory_items with NULL branch_id & branch_code: ${invNullBranch.length}`);

  // Check pos_orders
  const startISO = '2026-07-01T00:00:00.000Z';
  const endISO = '2026-07-31T23:59:59.999Z';
  const { data: allOrders } = await supabase
    .from('pos_orders')
    .select('*')
    .gte('updated_at', startISO)
    .lte('updated_at', endISO)
    .in('status', ['paid', 'completed']);

  const branchOrders = (allOrders || []).filter(o => o.branch_id === targetBranchId || (branch && o.branch_code === branch.branch_code));
  console.log(`Total valid orders matching branch: ${branchOrders.length}`);

  const orderIds = branchOrders.map(o => o.id);
  const { data: items } = await supabase.from('pos_order_items').select('*').in('order_id', orderIds.slice(0, 100));
  const { data: menuList } = await supabase.from('pos_menu_items').select('id, name, recipe_data, cost_price');

  console.log(`Sample order items count: ${items?.length}`);

  // Simulate POSReports.tsx costMap calculation
  const costMapStrict = new Map(invByBranchId.map(i => [i.id, i.cost_price || 0]));
  const costMapFallback = new Map(invItemsAll.map(i => [i.id, i.cost_price || 0]));

  let strictCogs = 0;
  let fallbackCogs = 0;

  items?.forEach(item => {
    const menuDb = menuList?.find(m => m.id === item.item_id);
    const menuRecipe = menuDb?.recipe_data || [];

    // Strict branch costMap
    const strictUnitCost = menuRecipe.reduce((sum, ing) => {
      const cost = costMapStrict.get(ing.ingredient_id) || 0;
      return sum + (cost * Number(ing.quantity || 0) * (ing.factor || 1));
    }, 0);
    const finalStrict = strictUnitCost > 0 ? strictUnitCost : (Number(item.cost_price) || Number(menuDb?.cost_price) || 0);
    strictCogs += finalStrict * Number(item.quantity || 1);

    // Fallback costMap
    const fbUnitCost = menuRecipe.reduce((sum, ing) => {
      const cost = costMapFallback.get(ing.ingredient_id) || 0;
      return sum + (cost * Number(ing.quantity || 0) * (ing.factor || 1));
    }, 0);
    const finalFb = fbUnitCost > 0 ? fbUnitCost : (Number(item.cost_price) || Number(menuDb?.cost_price) || 0);
    fallbackCogs += finalFb * Number(item.quantity || 1);
  });

  console.log(`Strict Branch COGS (simulated): ${strictCogs}`);
  console.log(`Fallback Global COGS (simulated): ${fallbackCogs}`);
}

checkBranchBug();
