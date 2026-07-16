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
    .select('id, name, printers')
    .limit(5);

  if (error) {
    console.error('Error fetching settings:', error);
  } else {
    console.log('Shop Settings Printers Configuration:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
