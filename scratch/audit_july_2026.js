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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("=== STARTING DEEP AUDIT FOR JULY 2026 ===");

  const startISO = '2026-07-01T00:00:00.000Z';
  const endISO = '2026-07-31T23:59:59.999Z';
  const startDateStr = '2026-07-01';
  const endDateStr = '2026-07-31';

  // 1. Fetch Orders
  const { data: allOrders, error: ordersErr } = await supabase
    .from('pos_orders')
    .select('*')
    .gte('updated_at', startISO)
    .lte('updated_at', endISO);

  if (ordersErr) {
    console.error("Error fetching orders:", ordersErr);
    return;
  }

  const validOrders = allOrders.filter(o => ['paid', 'completed'].includes(o.status));
  const cancelledOrders = allOrders.filter(o => ['void', 'cancelled', 'refunded'].includes(o.status));

  const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalDiscount = validOrders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);
  const totalGpFee = validOrders.reduce((sum, o) => sum + Number(o.delivery_gp_amount || 0), 0);

  console.log(`\n--- 1. SALES & REVENUE ---`);
  console.log(`Total Orders Range: ${allOrders.length} (Paid/Completed: ${validOrders.length}, Cancelled/Void: ${cancelledOrders.length})`);
  console.log(`Gross Revenue: ${totalRevenue.toFixed(2)} THB`);
  console.log(`Discounts: ${totalDiscount.toFixed(2)} THB`);
  console.log(`Net Revenue: ${(totalRevenue - totalDiscount).toFixed(2)} THB`);
  console.log(`Delivery Platform GP Fee: ${totalGpFee.toFixed(2)} THB`);

  // Breakdown by Platform / Order Type
  const platformBreakdown = {};
  validOrders.forEach(o => {
    const key = o.order_type === 'delivery' ? `Delivery (${o.delivery_platform || 'unknown'})` : o.order_type;
    if (!platformBreakdown[key]) platformBreakdown[key] = { count: 0, revenue: 0, gp: 0 };
    platformBreakdown[key].count++;
    platformBreakdown[key].revenue += Number(o.total_amount || 0);
    platformBreakdown[key].gp += Number(o.delivery_gp_amount || 0);
  });
  console.log("Sales Breakdown by Channel:", platformBreakdown);

  // 2. Inventory Cost Map & Recipe Analysis
  const { data: invItems } = await supabase.from('inventory_items').select('*');
  const costMap = new Map((invItems || []).map(i => [i.id, Number(i.cost_price || 0)]));
  const zeroCostInvItems = (invItems || []).filter(i => Number(i.cost_price || 0) === 0);

  const { data: menuList } = await supabase.from('pos_menu_items').select('*');
  const { data: modifierList } = await supabase.from('pos_menu_modifiers').select('*');

  const calculateDynamicCost = (recipe_data) => {
    if (!recipe_data || !Array.isArray(recipe_data)) return { cost: 0, hasZeroCostIng: false, details: [] };
    let hasZeroCostIng = false;
    const details = [];
    const cost = recipe_data.reduce((sum, ing) => {
      const unitCost = costMap.get(ing.ingredient_id) || 0;
      const qty = Number(ing.quantity || 0) * Number(ing.factor || 1);
      const ingCost = unitCost * qty;
      if (unitCost === 0 && qty > 0) hasZeroCostIng = true;
      details.push({ ingId: ing.ingredient_id, qty, unitCost, ingCost });
      return sum + ingCost;
    }, 0);
    return { cost, hasZeroCostIng, details };
  };

  // Analyze menu items for zero cost or missing cost
  const menuCostAnalysis = (menuList || []).map(m => {
    const recipeRes = calculateDynamicCost(m.recipe_data);
    const fixedCost = Number(m.cost_price || 0);
    const finalUnitCost = recipeRes.cost > 0 ? recipeRes.cost : fixedCost;
    return {
      id: m.id,
      name: m.name,
      price: m.price,
      recipeCost: recipeRes.cost,
      fixedCost: fixedCost,
      finalUnitCost,
      hasZeroCostIng: recipeRes.hasZeroCostIng,
      hasRecipe: Array.isArray(m.recipe_data) && m.recipe_data.length > 0
    };
  });

  const menuWithZeroCost = menuCostAnalysis.filter(m => m.finalUnitCost === 0);
  console.log(`\n--- 2. INVENTORY & RECIPE COST AUDIT ---`);
  console.log(`Total Inventory Items: ${invItems?.length || 0} (Items with cost=0: ${zeroCostInvItems.length})`);
  console.log(`Total Menu Items: ${menuList?.length || 0}`);
  console.log(`Menu items with ZERO calculated cost: ${menuWithZeroCost.length}`);
  if (menuWithZeroCost.length > 0) {
    console.log("Sample 0-cost menu items:", menuWithZeroCost.slice(0, 10).map(m => `${m.name} (Price: ${m.price})`));
  }

  // 3. Process Order Items for COGS
  const orderIds = validOrders.map(o => o.id);
  let totalCogs = 0;
  let totalItemsSold = 0;
  let itemsZeroCostCount = 0;

  const itemPerf = {};

  const chunkSize = 100;
  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const chunk = orderIds.slice(i, i + chunkSize);
    const { data: itemsChunk } = await supabase.from('pos_order_items').select('*').in('order_id', chunk);
    if (itemsChunk) {
      itemsChunk.forEach(item => {
        const qty = Number(item.quantity || 1);
        totalItemsSold += qty;

        const menuDb = menuList?.find(m => m.id === item.item_id);
        const baseCostRes = calculateDynamicCost(menuDb?.recipe_data);

        let modCost = 0;
        if (item.selected_modifiers && Array.isArray(item.selected_modifiers)) {
          item.selected_modifiers.forEach(mod => {
            const modName = mod.name || mod.title || '';
            const modDb = modifierList?.find(m => m.name === modName || m.id === mod.id);
            if (modDb) {
              modCost += calculateDynamicCost(modDb.recipe_data).cost;
            }
          });
        }

        const dynamicUnitCost = baseCostRes.cost + modCost;
        let finalUnitCost = dynamicUnitCost;

        if (dynamicUnitCost === 0) {
          finalUnitCost = Number(item.cost_price) || Number(menuDb?.cost_price) || 0;
        }

        if (finalUnitCost === 0) itemsZeroCostCount += qty;

        const lineCogs = finalUnitCost * qty;
        totalCogs += lineCogs;

        const name = menuDb?.name || item.name || 'Unknown';
        if (!itemPerf[name]) itemPerf[name] = { qty: 0, revenue: 0, cogs: 0 };
        itemPerf[name].qty += qty;
        itemPerf[name].revenue += Number(item.subtotal || 0);
        itemPerf[name].cogs += lineCogs;
      });
    }
  }

  console.log(`\n--- 3. ORDER COGS AUDIT ---`);
  console.log(`Total Quantity Sold: ${totalItemsSold}`);
  console.log(`Total Calculated COGS: ${totalCogs.toFixed(2)} THB`);
  console.log(`Items sold with 0 cost: ${itemsZeroCostCount} units`);
  console.log(`Gross Margin (Net Sales - COGS): ${(totalRevenue - totalDiscount - totalCogs).toFixed(2)} THB (${(((totalRevenue - totalDiscount - totalCogs) / (totalRevenue - totalDiscount)) * 100).toFixed(2)}%)`);

  // Top 5 highest revenue & Top 5 highest COGS
  const topSales = Object.entries(itemPerf).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
  console.log("Top 5 Menu Items by Sales:", topSales.map(([name, d]) => `${name}: Qty ${d.qty}, Rev ${d.revenue} THB, COGS ${d.cogs.toFixed(2)} THB`));

  // 4. Expenses Audit (pos_other_expenses)
  const { data: expenses } = await supabase.from('pos_other_expenses').select('*');
  let totalOtherExpenses = 0;
  const validExpensesList = [];

  (expenses || []).forEach(e => {
    const eDateStr = e.date;
    if (e.expense_type === 'monthly') {
      const amountForMonth = Number(e.amount || 0);
      totalOtherExpenses += amountForMonth;
      validExpensesList.push({ name: e.title || e.name || e.description || 'Monthly Expense', category: e.category, amount: amountForMonth, type: 'monthly' });
    } else {
      if (eDateStr >= startDateStr && eDateStr <= endDateStr) {
        const amt = Number(e.amount || 0);
        totalOtherExpenses += amt;
        validExpensesList.push({ name: e.title || e.name || e.description || 'Expense', category: e.category, amount: amt, type: 'one_time', date: eDateStr });
      }
    }
  });

  console.log(`\n--- 4. OTHER EXPENSES AUDIT ---`);
  console.log(`Total Other Expenses: ${totalOtherExpenses.toFixed(2)} THB`);
  console.log("Expenses List:", validExpensesList);

  // 5. Staff Labor Audit
  const { data: staffProfiles } = await supabase.from('profiles').select('*').eq('role', 'staff');
  const cafeStaff = (staffProfiles || []).filter(s => s.staff_type === 'cafe' && s.is_pos_account !== true);

  let totalLaborCost = 0;
  const staffLaborDetails = [];

  if (cafeStaff.length > 0) {
    const staffIds = cafeStaff.map(s => s.id);
    const { data: attendanceLogs } = await supabase
      .from('attendance_logs')
      .select('*')
      .in('profile_id', staffIds)
      .gte('timestamp', startISO)
      .lte('timestamp', endISO);

    cafeStaff.forEach(s => {
      const sLogs = (attendanceLogs || []).filter(l => l.profile_id === s.id);
      let staffCost = 0;
      let daysWorked = 0;

      if (s.salary_type === 'monthly') {
        staffCost = Number(s.daily_wage || 0);
        daysWorked = 31;
      } else {
        const workDaysSet = new Set();
        sLogs.forEach(l => {
          if (l.timestamp) {
            workDaysSet.add(l.timestamp.split('T')[0]);
          }
        });
        daysWorked = workDaysSet.size;
        staffCost = daysWorked * Number(s.daily_wage || 0);
      }

      totalLaborCost += staffCost;
      staffLaborDetails.push({
        name: s.display_name || `${s.first_name || ''} ${s.last_name || ''}`,
        type: s.salary_type,
        rate: s.daily_wage,
        daysWorked,
        totalCost: staffCost
      });
    });
  }

  console.log(`\n--- 5. STAFF LABOR COST AUDIT ---`);
  console.log(`Total Labor Cost: ${totalLaborCost.toFixed(2)} THB`);
  console.log("Staff Labor List:", staffLaborDetails);

  // 6. FINAL SUMMARY TABLE
  const netSales = totalRevenue - totalDiscount;
  const netProfit = netSales - totalCogs - totalLaborCost - totalOtherExpenses - totalGpFee;

  console.log(`\n========================================================`);
  console.log(`         JULY 2026 PROFIT & LOSS AUDIT REPORT           `);
  console.log(`========================================================`);
  console.log(` (+) Gross Revenue (ยอดขายรวม)      : ${totalRevenue.toFixed(2).padStart(12)} THB`);
  console.log(` (-) Discounts (ส่วนลด)             : ${totalDiscount.toFixed(2).padStart(12)} THB`);
  console.log(` (=) Net Sales (รายได้สุทธิ)         : ${netSales.toFixed(2).padStart(12)} THB`);
  console.log(`--------------------------------------------------------`);
  console.log(` (-) COGS / Ingredients (ต้นทุนวัตถุดิบ): ${totalCogs.toFixed(2).padStart(12)} THB`);
  console.log(` (-) Delivery GP (ค่าธรรมเนียม GP)   : ${totalGpFee.toFixed(2).padStart(12)} THB`);
  console.log(` (-) Labor Cost (ค่าแรงพนักงาน)      : ${totalLaborCost.toFixed(2).padStart(12)} THB`);
  console.log(` (-) Other Expenses (ค่าใช้จ่ายอื่นๆ): ${totalOtherExpenses.toFixed(2).padStart(12)} THB`);
  console.log(`--------------------------------------------------------`);
  console.log(` (=) Net Profit (กำไรสุทธิ)         : ${netProfit.toFixed(2).padStart(12)} THB`);
  console.log(` Net Profit Margin                   : ${((netProfit / netSales) * 100).toFixed(2)}%`);
  console.log(`========================================================\n`);

  // Output anomalies detected
  console.log(`--- DISCOVERED ANOMALIES & POTENTIAL INACCURACIES ---`);
  console.log(`1. Inventory items with cost_price = 0: ${zeroCostInvItems.length} items`);
  console.log(`2. Menu items with calculated recipe unit cost = 0: ${menuWithZeroCost.length} items`);
  console.log(`3. Order items sold with 0 cost recorded: ${itemsZeroCostCount} units`);
}

runAudit().catch(err => console.error("Audit error:", err));
