import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('pos_loyalty_tiers').select('*');
  console.log('pos_loyalty_tiers:', data);
  const { data: c, error: cErr } = await supabase.from('pos_campaigns').select('*');
  console.log('pos_campaigns:', c);
}
run();
