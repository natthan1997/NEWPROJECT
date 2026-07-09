const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: './.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const query = `
    SELECT 
      conname, 
      pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'public.pos_orders'::regclass;
  `;
  const { data, error } = await supabase.rpc('run_sql', { query });
  if (error) {
    console.error("Error executing query:", error);
  } else {
    console.log("Constraints:", JSON.stringify(data, null, 2));
  }
}
run();
