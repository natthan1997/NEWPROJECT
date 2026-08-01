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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findDroppedItems() {
  const targetBranchId = '1f3fc496-d89e-4323-a66e-4fcd555444e9';
  const startISO = '2026-07-01T00:00:00.000Z';
  const endISO = '2026-07-24T23:59:59.999Z';

  const { data: allOrders } = await supabase
    .from('pos_orders')
    .select('id, created_at, updated_at, total_amount')
    .gte('updated_at', startISO)
    .lte('updated_at', endISO)
    .in('status', ['paid', 'completed']);

  const orderIds = (allOrders || []).map(o => o.id);
  console.log(`Total order IDs up to July 24: ${orderIds.length}`);

  // Fetch 1: Single query without chunking (Old bug behavior)
  const { data: singleItems, error: singleErr } = await supabase
    .from('pos_order_items')
    .select('*')
    .in('order_id', orderIds);

  console.log("Single query error:", singleErr);
  console.log("Single query returned items count:", singleItems?.length || 0);

  // Fetch 2: Chunked query (New fixed behavior)
  let chunkedItems = [];
  const chunkSize = 100;
  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const chunk = orderIds.slice(i, i + chunkSize);
    const { data: itemsChunk } = await supabase.from('pos_order_items').select('*').in('order_id', chunk);
    if (itemsChunk) chunkedItems = chunkedItems.concat(itemsChunk);
  }
  console.log("Chunked query returned items count:", chunkedItems.length);

  // Compare which orders or items were dropped in single query
  const singleItemIds = new Set((singleItems || []).map(i => i.id));
  const droppedItems = chunkedItems.filter(i => !singleItemIds.has(i.id));

  console.log(`\nDropped Items Count: ${droppedItems.length}`);

  // Group dropped items by menu item name
  const { data: menuList } = await supabase.from('pos_menu_items').select('id, name, recipe_data');
  const menuNameMap = new Map((menuList || []).map(m => [m.id, m.name]));

  const droppedByMenu = {};
  droppedItems.forEach(item => {
    const name = menuNameMap.get(item.item_id) || item.name || 'Unknown';
    if (!droppedByMenu[name]) droppedByMenu[name] = { qty: 0, orderIds: new Set() };
    droppedByMenu[name].qty += Number(item.quantity || 1);
    droppedByMenu[name].orderIds.add(item.order_id);
  });

  console.log("\n=== DROPPED MENU ITEMS BREAKDOWN ===");
  Object.entries(droppedByMenu)
    .sort((a, b) => b[1].qty - a[1].qty)
    .forEach(([name, data]) => {
      console.log(`- ${name}: Missing ${data.qty} units (across ${data.orderIds.size} orders)`);
    });
}

findDroppedItems();
