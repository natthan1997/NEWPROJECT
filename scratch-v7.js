const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCoupons() {
  const { data, error } = await supabase
    .from('pos_member_coupons')
    .select('*, member:pos_members(*)')
    .limit(5);

  if (error) {
    console.error('Error fetching member coupons:', error);
    return;
  }
  
  console.log('Successfully fetched coupons:', data);
}

checkCoupons();
