const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: `
    ALTER TABLE pos_loyalty_titles ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE pos_loyalty_titles ADD COLUMN IF NOT EXISTS benefits TEXT;
    NOTIFY pgrst, 'reload schema';
  ` });
  console.log('RPC Error:', error);
}
run();
