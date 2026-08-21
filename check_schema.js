const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data: branches, error: err1 } = await supabase.from('branches').select('*').limit(1);
  console.log('Branches columns:', branches ? (branches.length > 0 ? Object.keys(branches[0]) : 'Empty table') : err1);

  const { data: shopSettings, error: err2 } = await supabase.from('pos_shop_settings').select('*').limit(1);
  console.log('Shop Settings columns:', shopSettings ? (shopSettings.length > 0 ? Object.keys(shopSettings[0]) : 'Empty table') : err2);

  const { data: profiles, error: err3 } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles columns:', profiles ? (profiles.length > 0 ? Object.keys(profiles[0]) : 'Empty table') : err3);
}

checkSchema();
