const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: './.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const query = `
    SELECT 
      trigger_name, 
      event_manipulation, 
      event_object_table, 
      action_statement, 
      action_orientation, 
      action_timing
    FROM information_schema.triggers
    WHERE event_object_table LIKE 'pos_%';
  `;
  const { data, error } = await supabase.rpc('run_sql', { query });
  if (error) {
    console.error("Error executing query:", error);
  } else {
    console.log("Triggers:", JSON.stringify(data, null, 2));
  }
}
run();
