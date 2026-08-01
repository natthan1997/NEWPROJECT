const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('profiles').select('id, branch_code, branch_id').limit(1);
  console.log(JSON.stringify(data, null, 2));
}
run();
