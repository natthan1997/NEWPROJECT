const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('pos_shop_settings').select('opening_hours').order('updated_at', { ascending: false }).limit(1).maybeSingle();
  console.log("Anon select pos_shop_settings:");
  console.log("Data:", data);
  console.log("Error:", error);
}

main();
