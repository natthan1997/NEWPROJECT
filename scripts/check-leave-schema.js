require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('staff_leaves').select('*').limit(1);
  console.log("staff_leaves:", data);

  const { data: p, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  console.log("profiles keys:", Object.keys(p[0] || {}));
}
run();
