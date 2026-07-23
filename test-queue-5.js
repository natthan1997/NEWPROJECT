const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('get_column_info', { table_name: 'pos_orders', column_name: 'queue_number' });
  if (error) {
    console.log('RPC failed, trying raw query via pgmeta...');
  }
}

test();
