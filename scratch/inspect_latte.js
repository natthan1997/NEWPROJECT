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

async function inspectLatteRecipe() {
  const { data: menuList } = await supabase.from('pos_menu_items').select('*').in('name', ['ลาเต้', 'อเมริกาโน่เย็น', 'เอสเย็น']);
  const { data: invItems } = await supabase.from('inventory_items').select('*');
  const invMap = new Map((invItems || []).map(i => [i.id, i]));

  console.log("=== RAW RECIPE DATA INSPECTION ===");
  menuList.forEach(m => {
    console.log(`\nMenu: "${m.name}"`);
    console.log(JSON.stringify(m.recipe_data, null, 2));
    if (Array.isArray(m.recipe_data)) {
      m.recipe_data.forEach(ing => {
        const inv = invMap.get(ing.ingredient_id);
        const qty = Number(ing.quantity || 0);
        const factor = Number(ing.factor !== undefined ? ing.factor : 1);
        const unitCost = Number(inv?.cost_price || 0);
        const calcCost = unitCost * qty * factor;
        console.log(`Ing: ${inv?.name} | qty: ${qty} | factor: ${factor} | unitCost: ${unitCost} | calcCost: ${calcCost}`);
      });
    }
  });
}

inspectLatteRecipe();
