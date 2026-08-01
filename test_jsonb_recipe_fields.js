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

async function testJSONB() {
  const { data: mods, error } = await supabase.from('pos_menu_modifiers').select('id, name, recipe_data').limit(1);
  if (error) {
    console.error("Fetch error:", error);
    return;
  }
  console.log("Sample modifier recipe_data before:", JSON.stringify(mods[0]?.recipe_data));
}

testJSONB();
