const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // 1. Create temp table and populate it
  await supabase.rpc('run_migration', {
    migration_name: 'temp_check_policies.sql',
    migration_sql: `
      DROP TABLE IF EXISTS temp_policies;
      CREATE TABLE temp_policies AS
      SELECT policyname, roles, cmd, qual::text, with_check::text
      FROM pg_policies
      WHERE tablename = 'pos_points_history';
    `
  });

  // 2. Select from temp table
  const { data, error } = await supabase.from('temp_policies').select('*');
  console.log("Policies:", data, error);

  // 3. Drop temp table
  await supabase.rpc('run_migration', {
    migration_name: 'temp_drop_policies.sql',
    migration_sql: `DROP TABLE IF EXISTS temp_policies;`
  });
}

main();
