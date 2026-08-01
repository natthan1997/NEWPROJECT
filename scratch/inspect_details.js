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

async function inspectDetails() {
  console.log("=== INSPECTING ZERO-COST INVENTORY ITEMS & FOOD RECIPES ===");

  const { data: invItems } = await supabase.from('inventory_items').select('*');
  const zeroCostItems = (invItems || []).filter(i => Number(i.cost_price || 0) === 0);
  console.log("\n--- All Zero-Cost Inventory Items ---");
  zeroCostItems.forEach(i => console.log(`- ${i.name} (Unit: ${i.unit || 'N/A'}, Stock: ${i.current_stock || 0}, ID: ${i.id})`));

  const zeroCostIds = new Set(zeroCostItems.map(i => i.id));

  // Check which menu items use these zero-cost ingredients
  const { data: menuList } = await supabase.from('pos_menu_items').select('*');
  console.log("\n--- Menu Items using 0-Cost Ingredients ---");

  (menuList || []).forEach(m => {
    if (Array.isArray(m.recipe_data)) {
      const zeroIngsUsed = m.recipe_data.filter(ing => zeroCostIds.has(ing.ingredient_id));
      if (zeroIngsUsed.length > 0) {
        console.log(`Menu Item: "${m.name}" (Price: ${m.price} THB, Stated Cost: ${m.cost_price || 0} THB)`);
        zeroIngsUsed.forEach(ing => {
          const invObj = zeroCostItems.find(i => i.id === ing.ingredient_id);
          console.log(`  -> Uses 0-cost ingredient: "${invObj?.name}" (Qty: ${ing.quantity})`);
        });
      }
    }
  });

  // Check Cancelled/Voided Orders
  const startISO = '2026-07-01T00:00:00.000Z';
  const endISO = '2026-07-31T23:59:59.999Z';
  const { data: cancelledOrders } = await supabase
    .from('pos_orders')
    .select('*')
    .gte('updated_at', startISO)
    .lte('updated_at', endISO)
    .in('status', ['void', 'cancelled', 'refunded']);

  console.log(`\n--- Cancelled / Voided Orders Audit ---`);
  console.log(`Total Cancelled Orders: ${cancelledOrders?.length || 0}`);
  const cancelledTotalVal = (cancelledOrders || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  console.log(`Total Lost Revenue from Cancelled Orders: ${cancelledTotalVal.toFixed(2)} THB`);

  // Check OT in attendance logs
  const { data: attendanceLogs } = await supabase
    .from('attendance_logs')
    .select('*')
    .gte('timestamp', startISO)
    .lte('timestamp', endISO);

  console.log(`\n--- Attendance & OT Check ---`);
  console.log(`Total Logs in July: ${attendanceLogs?.length || 0}`);
}

inspectDetails();
