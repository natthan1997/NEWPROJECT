const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRLS() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { table_name: 'pos_shop_settings' });
  if (error) {
    // Fallback to raw query using admin
    const { data: rawData, error: rawError } = await supabase.from('pg_policies').select('*').eq('tablename', 'pos_shop_settings');
    console.log('Policies for pos_shop_settings:', rawData || rawError);
  } else {
    console.log(data);
  }
}

checkRLS();
