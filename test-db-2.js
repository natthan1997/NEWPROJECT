const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('gacha_rewards_pool').select('*').eq('is_active', true).order('rarity_tier', { ascending: false }).then(({ data, error }) => {
  console.log('Query result:', data, 'Error:', error);
});
