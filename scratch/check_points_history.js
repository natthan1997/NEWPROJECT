const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  "https://cdjbzyrflzckjgxbqjqb.supabase.co", // Hardcoded because NEXT_PUBLIC_SUPABASE_URL isn't in .env.local
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('pos_points_history').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('History:', data);
  if (error) console.log('Error:', error);
}
check();
