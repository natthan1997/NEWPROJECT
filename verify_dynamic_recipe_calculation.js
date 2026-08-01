const fs = require('fs');
const path = require('path');

// Simulate Phase 1, 2, 3 logic from replace_checkout.ts
function simulateStockDeduction(cart, orderType = 'dine_in') {
  const movements = [];

  for (const item of cart) {
    const selectedMods = item.selected_modifiers || [];

    // Phase 1: Context Extraction
    let sweetnessRatio = 1.0;
    let activeRoastIngredientId = null;
    const substitutionsMap = new Map();

    selectedMods.forEach(mod => {
      if (mod.sweetness_multiplier !== undefined && mod.sweetness_multiplier !== null) {
        sweetnessRatio = Number(mod.sweetness_multiplier);
      } else if (mod.name) {
        if (mod.name.includes('0%')) sweetnessRatio = 0.0;
        else if (mod.name.includes('25%')) sweetnessRatio = 0.25;
        else if (mod.name.includes('50%')) sweetnessRatio = 0.50;
        else if (mod.name.includes('125%')) sweetnessRatio = 1.25;
      }

      const modRecipes = mod.recipe_data || [];
      modRecipes.forEach(ing => {
        if (mod.name && (mod.name.includes('คั่ว') || mod.name.includes('Roast')) && ing.ingredient_id) {
          activeRoastIngredientId = ing.ingredient_id;
        }
        if (ing.is_substitution || mod.is_substitution || (mod.name && (mod.name.includes('Almond') || mod.name.includes('Oat') || mod.name.includes('อัลมอนด์')))) {
          const targetName = ing.substitute_target_name || 'นมสด';
          substitutionsMap.set(targetName, { newIngredientId: ing.ingredient_id, name: ing.name });
        }
      });
    });

    // Phase 2: Base Menu Recipe Deduction
    let reducedSweetenerVolume = 0;
    let baseLiquidIngIndex = -1;
    const baseIngredientsToDeduct = [];

    if (item.recipe_data && Array.isArray(item.recipe_data)) {
      item.recipe_data.forEach((ing, idx) => {
        if (ing.order_types && Array.isArray(ing.order_types) && !ing.order_types.includes(orderType)) return;

        let baseQty = Number(ing.quantity || 0);
        const factor = Number(ing.factor || 1);

        const isSweetener = ing.is_sweetener || (ing.name && (ing.name.includes('น้ำเชื่อม') || ing.name.includes('นมข้น') || ing.name.includes('ไซรัป') || ing.name.includes('Syrup')));
        const isBaseLiquid = ing.is_base_liquid || (ing.name && (ing.name.includes('ชา') || ing.name.includes('กาแฟ') || ing.name.includes('Coffee') || ing.name.includes('Tea')));

        if (isSweetener) {
          const scaledQty = baseQty * sweetnessRatio;
          reducedSweetenerVolume += (baseQty - scaledQty) * factor;
          baseQty = scaledQty;
        } else if (isBaseLiquid && baseLiquidIngIndex === -1) {
          baseLiquidIngIndex = idx;
        }

        let targetId = ing.ingredient_id;
        let targetName = ing.name;
        substitutionsMap.forEach((sub, key) => {
          if (ing.name && ing.name.includes(key)) {
            targetId = sub.newIngredientId;
            targetName = sub.name;
          }
        });

        if (targetId && baseQty > 0) {
          baseIngredientsToDeduct.push({ ingredient_id: targetId, name: targetName, quantity: baseQty, factor });
        }
      });

      if (reducedSweetenerVolume > 0 && baseLiquidIngIndex !== -1 && item.recipe_data[baseLiquidIngIndex]) {
        const baseIng = item.recipe_data[baseLiquidIngIndex];
        const baseFactor = Number(baseIng.factor || 1);
        const topUpQty = reducedSweetenerVolume / (baseFactor || 1);
        
        const existingDeduct = baseIngredientsToDeduct.find(b => b.ingredient_id === baseIng.ingredient_id);
        if (existingDeduct) {
          existingDeduct.quantity += topUpQty;
        }
      }

      for (const bIng of baseIngredientsToDeduct) {
        const usage = bIng.quantity * bIng.factor * Number(item.quantity);
        if (usage > 0) {
          movements.push({
            ingredient_id: bIng.ingredient_id,
            name: bIng.name,
            deducted_quantity: usage
          });
        }
      }
    }

    // Phase 3: Extra Modifier Recipe Deduction
    if (item.selected_modifiers && Array.isArray(item.selected_modifiers)) {
      for (const mod of item.selected_modifiers) {
        if (mod.recipe_data && Array.isArray(mod.recipe_data)) {
          for (const ing of mod.recipe_data) {
            if (ing.order_types && Array.isArray(ing.order_types) && !ing.order_types.includes(orderType)) continue;
            if (ing.is_substitution) continue;

            let targetIngId = ing.ingredient_id;
            let targetIngName = ing.name;
            if ((ing.is_contextual_roast || (mod.name && mod.name.includes('Shot'))) && activeRoastIngredientId) {
              targetIngId = activeRoastIngredientId;
              targetIngName = 'เมล็ดกาแฟคั่วอ่อน (Inherited Roast)';
            }

            const usage = Number(ing.quantity || 0) * Number(ing.factor || 1) * Number(item.quantity);
            if (targetIngId && usage > 0) {
              movements.push({
                ingredient_id: targetIngId,
                name: targetIngName,
                deducted_quantity: usage
              });
            }
          }
        }
      }
    }
  }

  return movements;
}

// TEST CASES
console.log("=== RUNNING DYNAMIC RECIPE VERIFICATION TESTS ===");

// Test 1: Substitution (Fresh Milk 150ml -> Almond Milk 150ml)
const testCart1 = [{
  name: 'ลาเต้เย็น',
  quantity: 1,
  recipe_data: [{ ingredient_id: 'ing-fresh-milk', name: 'นมสด', quantity: 150, factor: 1 }],
  selected_modifiers: [{
    name: 'Almond Milk',
    recipe_data: [{ ingredient_id: 'ing-almond-milk', name: 'นมอัลมอนด์', quantity: 1, is_substitution: true, substitute_target_name: 'นมสด' }]
  }]
}];
console.log("\n--- TEST 1: Substitution (Fresh Milk -> Almond Milk) ---");
console.log("Resulting Deductions:", simulateStockDeduction(testCart1));

// Test 2: Contextual Roast Inheritance (Americano Light Roast + 1 Espresso Shot)
const testCart2 = [{
  name: 'อเมริกาโน่เย็น',
  quantity: 1,
  recipe_data: [{ ingredient_id: 'ing-[#1A1A18]-dark-roast', name: 'เมล็ดกาแฟคั่วเข้ม (Base)', quantity: 18, factor: 1 }],
  selected_modifiers: [
    {
      name: 'คั่วอ่อน',
      recipe_data: [{ ingredient_id: 'ing-light-roast', name: 'เมล็ดกาแฟคั่วอ่อน', quantity: 18, factor: 1 }]
    },
    {
      name: 'Espresso Shot (+1 Shot)',
      recipe_data: [{ ingredient_id: 'ing-default-shot', name: 'Espresso Shot (Default)', quantity: 18, factor: 1, is_contextual_roast: true }]
    }
  ]
}];
console.log("\n--- TEST 2: Contextual Roast Inheritance (Light Roast + Extra Shot) ---");
console.log("Resulting Deductions:", simulateStockDeduction(testCart2));

// Test 3: Sweetness 0% & Base Liquid Top-up (Thai Tea 120ml + Syrup 15ml + Condensed Milk 20ml -> 0% Sweetness)
const testCart3 = [{
  name: 'ชาไทยเย็น',
  quantity: 1,
  recipe_data: [
    { ingredient_id: 'ing-thai-tea', name: 'ชาไทยเบส', quantity: 120, factor: 1, is_base_liquid: true },
    { ingredient_id: 'ing-syrup', name: 'น้ำเชื่อม', quantity: 15, factor: 1, is_sweetener: true },
    { ingredient_id: 'ing-condensed-milk', name: 'นมข้นหวาน', quantity: 20, factor: 1, is_sweetener: true }
  ],
  selected_modifiers: [
    { name: 'ไม่หวาน 0%', sweetness_multiplier: 0.0 }
  ]
}];
console.log("\n--- TEST 3: Sweetness 0% & Base Liquid Compensation ---");
console.log("Resulting Deductions:", simulateStockDeduction(testCart3));
