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

async function deepRecipeAudit() {
  console.log("=== DEEP RECIPE & COGS AUDIT ===");

  const { data: menuList } = await supabase.from('pos_menu_items').select('*');
  const { data: invItems } = await supabase.from('inventory_items').select('*');
  const invMap = new Map((invItems || []).map(i => [i.id, i]));

  let totalFactorBugs = 0;
  let totalMissingCoffeeBeans = 0;
  let totalNoRecipe = 0;

  console.log("\n--- MENU RECIPE ANOMALIES & AUDIT ---");

  const correctedMenuCosts = {};

  (menuList || []).forEach(m => {
    let hasFactorBug = false;
    let missingBeans = false;
    let rawRecipeCost = 0;
    let correctedRecipeCost = 0;

    const isCoffee = m.name.includes('เอส') || m.name.includes('ลาเต้') || m.name.includes('อเมริกาโน่') || m.name.includes('คาปู') || m.name.includes('มอคค่า') || m.name.includes('มัคคิอาโต้') || m.name.includes('Americano') || m.name.includes('Latte') || m.name.includes('Espresso') || m.name.includes('Cappuccino') || m.name.includes('Mocha');

    let hasBeanIngredient = false;

    if (Array.isArray(m.recipe_data) && m.recipe_data.length > 0) {
      m.recipe_data.forEach(ing => {
        const inv = invMap.get(ing.ingredient_id);
        const unitCost = Number(inv?.cost_price || 0);
        const qty = Number(ing.quantity || 0);
        const factor = Number(ing.factor !== undefined ? ing.factor : 1);

        if (inv?.name.includes('เมล็ดกาแฟ') || ing.name?.includes('เมล็ดกาแฟ')) {
          hasBeanIngredient = true;
        }

        // Current system calculation
        rawRecipeCost += unitCost * qty * factor;

        // Corrected calculation: if inv cost_price is per ml/gram (e.g. < 1 THB) and factor is 0.001, factor should be 1
        let realFactor = factor;
        if (factor === 0.001 && (inv?.unit === 'ml' || inv?.unit === 'กรัม' || inv?.unit === 'g' || unitCost < 1)) {
          realFactor = 1;
          hasFactorBug = true;
        }
        correctedRecipeCost += unitCost * qty * realFactor;
      });

      if (isCoffee && !hasBeanIngredient) {
        missingBeans = true;
        // Add ~9 THB for 18g coffee beans @ 0.5 THB/g
        correctedRecipeCost += 9.0;
      }
    } else {
      totalNoRecipe++;
      // If no recipe, use fixed cost_price or 40% of price
      correctedRecipeCost = Number(m.cost_price || 0);
      if (correctedRecipeCost === 0 && Number(m.price || 0) > 0) {
        correctedRecipeCost = Number(m.price) * 0.35; // 35% estimate
      }
    }

    if (hasFactorBug) totalFactorBugs++;
    if (missingBeans) totalMissingCoffeeBeans++;

    // Final unit cost logic
    const systemCost = rawRecipeCost > 0 ? rawRecipeCost : (Number(m.cost_price) || 0);
    const trueCost = correctedRecipeCost > 0 ? correctedRecipeCost : systemCost;

    correctedMenuCosts[m.id] = {
      name: m.name,
      price: m.price,
      systemCost,
      trueCost,
      hasFactorBug,
      missingBeans,
      hasNoRecipe: !m.recipe_data || m.recipe_data.length === 0
    };

    if (hasFactorBug || missingBeans) {
      console.log(`[ANOMALY] "${m.name}" | System Cost: ${systemCost.toFixed(2)} THB | True Cost: ${trueCost.toFixed(2)} THB | FactorBug: ${hasFactorBug} | MissingBeans: ${missingBeans}`);
    }
  });

  console.log(`\nSummary of Menu Anomalies:`);
  console.log(` - Items with 0.001 factor bug: ${totalFactorBugs}`);
  console.log(` - Coffee items missing coffee beans in recipe: ${totalMissingCoffeeBeans}`);
  console.log(` - Menu items without recipe (using fallback): ${totalNoRecipe}`);

  // Recalculate July 2026 COGS with True Cost
  const startISO = '2026-07-01T00:00:00.000Z';
  const endISO = '2026-07-31T23:59:59.999Z';
  const { data: validOrders } = await supabase
    .from('pos_orders')
    .select('id')
    .gte('updated_at', startISO)
    .lte('updated_at', endISO)
    .in('status', ['paid', 'completed']);

  const orderIds = (validOrders || []).map(o => o.id);
  let systemTotalCogs = 0;
  let trueTotalCogs = 0;

  const chunkSize = 100;
  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const chunk = orderIds.slice(i, i + chunkSize);
    const { data: itemsChunk } = await supabase.from('pos_order_items').select('*').in('order_id', chunk);
    if (itemsChunk) {
      itemsChunk.forEach(item => {
        const qty = Number(item.quantity || 1);
        const cData = correctedMenuCosts[item.item_id];
        if (cData) {
          systemTotalCogs += cData.systemCost * qty;
          trueTotalCogs += cData.trueCost * qty;
        }
      });
    }
  }

  console.log(`\n=== REVISED JULY 2026 COGS IMPACT ===`);
  console.log(` Current System Recorded COGS : ${systemTotalCogs.toFixed(2)} THB`);
  console.log(` True Audited COGS (Corrected): ${trueTotalCogs.toFixed(2)} THB`);
  console.log(` Underestimated COGS Difference: +${(trueTotalCogs - systemTotalCogs).toFixed(2)} THB`);
}

deepRecipeAudit();
