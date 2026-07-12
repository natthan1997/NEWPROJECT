const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStore() {
  const { data: settings, error } = await supabase
    .from('pos_shop_settings')
    .select('*, branches!branch_id(*)');

  if (error) {
    console.error('Error:', error);
    return;
  }
  
  settings.forEach(s => {
    console.log('Branch ID:', s.branch_id);
    console.log('Is Open:', s.is_open);
    console.log('Status:', s.status);
    console.log('Opening Hours:', JSON.stringify(s.opening_hours, null, 2));
    console.log('---');
  });
}

checkStore();
