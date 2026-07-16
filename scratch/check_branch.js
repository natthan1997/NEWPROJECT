const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Env variables missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Fetch profiles
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, email, role, branch_code');
    
  if (pErr) console.error(pErr);
  else console.log('Profiles:', profiles);

  // Fetch branches
  const { data: branches, error: bErr } = await supabase
    .from('branches')
    .select('*');
    
  if (bErr) console.error(bErr);
  else console.log('Branches:', branches);
}

run();
