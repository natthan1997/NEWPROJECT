const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  "https://cdjbzyrflzckjgxbqjqb.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('pos_points_history').select('*').limit(1);
  if (error) {
    console.log('Error querying pos_points_history:', error);
  } else {
    console.log('Success, data:', data);
  }
}
check();
