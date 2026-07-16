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
  const { data, error } = await supabase
    .from('pos_shop_settings')
    .select('*');

  if (error) {
    console.error('Error fetching settings:', error);
  } else {
    console.log(`Found ${data.length} shop settings rows:`);
    data.forEach((row, i) => {
      console.log(`\n--- Row ${i + 1} ---`);
      console.log(`id: ${row.id}`);
      console.log(`branch_id: ${row.branch_id}`);
      console.log(`status: ${row.status}`);
      console.log(`is_open: ${row.is_open}`);
      console.log(`printers:`, JSON.stringify(row.printers, null, 2));
    });
  }
}

run();
