const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setup() {
  console.log('Creating pos_member_tiers table...');
  const { error: createError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS pos_member_tiers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        min_points INTEGER NOT NULL,
        multiplier NUMERIC NOT NULL DEFAULT 1.0,
        discount_rate NUMERIC NOT NULL DEFAULT 0.0,
        benefits JSONB,
        bg_hex TEXT,
        text_hex TEXT,
        bar_hex TEXT,
        order_index INTEGER DEFAULT 0
      );
    `
  });
  
  if (createError) {
     console.log('Failed to execute SQL via RPC. Using REST to create table... (This usually fails, we may need to ask user to run it via Dashboard)');
     console.log(createError);
  }
}
setup();
