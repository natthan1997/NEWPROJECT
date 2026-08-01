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

async function testQueryError() {
  console.log("=== TESTING INVENTORY QUERY WITH BRANCH CODE ===");

  const { data: inv1, error: err1 } = await supabase.from('inventory_items').select('id, cost_price').eq('branch_code', '01');
  console.log("Query with branch_code '01':");
  console.log("  data:", inv1);
  console.log("  error:", err1);

  const { data: inv2, error: err2 } = await supabase.from('inventory_items').select('id, cost_price').eq('branch_id', '1f3fc496-d89e-4323-a66e-4fcd555444e9');
  console.log("\nQuery with branch_id '1f3fc496-d89e-4323-a66e-4fcd555444e9':");
  console.log("  data count:", inv2?.length);
  console.log("  error:", err2);
}

testQueryError();
