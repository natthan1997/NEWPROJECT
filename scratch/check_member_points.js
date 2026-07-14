const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await supabase
    .from('pos_members')
    .select('id, points, line_user_id')
    .eq('id', '36884b18-ed44-463e-8e19-c52aa9a0b8dc')
    .single();
  
  console.log(data);
}

main();
