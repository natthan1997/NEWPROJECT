const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_social_security BOOLEAN DEFAULT false;"
  });
  if (error) {
    console.error("RPC exec_sql failed, trying direct REST query if allowed, or it might need manual intervention:", error);
  } else {
    console.log("Migration successful");
  }
}
run();
