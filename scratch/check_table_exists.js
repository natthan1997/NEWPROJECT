require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data, error } = await supabase.from('pos_member_checkins').select('*').limit(1);
  if (error) {
    console.log('Table check error:', error);
  } else {
    console.log('Table exists! Data:', data);
  }
})();
