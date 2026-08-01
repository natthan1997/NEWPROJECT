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

async function checkRecipeOnlyVsTotal() {
  const targetBranchId = '1f3fc496-d89e-4323-a66e-4fcd555444e9';
  const startISO = '2026-07-01T00:00:00.000Z';
  const endISO = '2026-07-31T23:59:59.999Z';

  const { data: allOrders } = await supabase
    .from('pos_orders')
    .select('id')
    .gte('updated_at', startISO)
    .lte('updated_at', endISO)
    .in('status', ['paid', 'completed']);

  const orderIds = (allOrders || []).map(o => o.id);

  const { data: invItems } = await supabase.from('inventory_items').select('id, cost_price').eq('branch_id', targetBranchId);
  const costMap = new Map((invItems || []).map(i => [i.id, i.cost_price || 0]));

  const calculateDynamicCost = (recipe_data) => {
    return (recipe_data || []).reduce((sum, ing) => {
      const cost = costMap.get(ing.ingredient_id) || 0;
      return sum + (cost * Number(ing.quantity || 0) * (ing.factor || 1));
    }, 0);
  };

  const { data: menuList } = await supabase.from('pos_menu_items').select('id, name, recipe_data, cost_price');
  const { data: modifierList } = await supabase.from('pos_menu_modifiers').select('id, name, recipe_data');

  let recipeOnlyCogs = 0;
  let fixedFallbackCogs = 0;

  const chunkSize = 100;
  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const chunk = orderIds.slice(i, i + chunkSize);
    const { data: itemsChunk } = await supabase.from('pos_order_items').select('*').in('order_id', chunk);
    if (itemsChunk) {
      itemsChunk.forEach(item => {
        const qty = Number(item.quantity || 1);
        const menuDb = menuList?.find(m => m.id === item.item_id);
        const dynamicCost = calculateDynamicCost(menuDb?.recipe_data);

        recipeOnlyCogs += dynamicCost * qty;

        if (dynamicCost === 0) {
          fixedFallbackCogs += (Number(item.cost_price) || Number(menuDb?.cost_price) || 0) * qty;
        }
      });
    }
  }

  console.log(`Recipe-Only COGS (เฉพาะเมนูที่มีสูตร): ${recipeOnlyCogs.toFixed(2)} THB`);
  console.log(`Fixed Fallback COGS (เมนูที่ไม่มีสูตร เช่น อาหาร/ขนม): ${fixedFallbackCogs.toFixed(2)} THB`);
  console.log(`TOTAL COMBINED COGS: ${(recipeOnlyCogs + fixedFallbackCogs).toFixed(2)} THB`);
}

checkRecipeOnlyVsTotal();
