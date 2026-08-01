const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdjbzyrflzckjgxbqjqb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const { createClient } = require(path.join(process.cwd(), 'node_modules', '@supabase/supabase-js'));
const supabase = createClient(supabaseUrl, supabaseKey);

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fixModifiers() {
  console.log("=== CLEANING UP DUMMY NON-UUID RECIPE ITEMS IN MODIFIERS ===");
  const { data: modifiers } = await supabase.from('pos_menu_modifiers').select('*');

  let count = 0;
  for (const mod of modifiers || []) {
    const recipe = mod.recipe_data || [];
    const cleanRecipe = recipe.filter(ing => ing.ingredient_id && uuidRegex.test(ing.ingredient_id));

    if (cleanRecipe.length !== recipe.length) {
      await supabase.from('pos_menu_modifiers').update({ recipe_data: cleanRecipe }).eq('id', mod.id);
      count++;
      console.log(`Cleaned up modifier: "${mod.name}"`);
    }
  }

  console.log(`Total Modifiers Cleaned: ${count}`);
}

fixModifiers();
