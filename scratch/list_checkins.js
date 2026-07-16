require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data, error } = await supabase.from('pos_member_checkins').select('*').order('created_at', { ascending: false }).limit(10);
  if (error) {
    console.log('Error fetching check-ins:', error);
  } else {
    console.log('Recent check-ins:', JSON.stringify(data, null, 2));
  }
})();
