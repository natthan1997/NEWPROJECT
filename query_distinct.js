const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('profiles').select('staff_type').neq('staff_type', null);
  const unique = [...new Set(data?.map(d => d.staff_type))];
  console.log('Unique staff types:', unique);
}
run();
