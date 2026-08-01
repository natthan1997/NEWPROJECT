require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: p } = await supabase.from('profiles').select('*').limit(1);
  console.log("profiles keys:", Object.keys(p[0] || {}).filter(k => k.includes('leave') || k.includes('quota') || k.includes('sick')));
}
run();
