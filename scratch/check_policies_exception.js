const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.rpc('run_migration', {
    migration_name: 'check_policies.sql',
    migration_sql: `
      DO $$
      DECLARE
        policy_info TEXT;
      BEGIN
        SELECT string_agg(policyname || ' | ' || array_to_string(roles, ', ') || ' | ' || cmd || ' | ' || qual::text, E'\n')
        INTO policy_info
        FROM pg_policies
        WHERE tablename = 'pos_points_history';
        
        RAISE EXCEPTION 'POLICIES: %', policy_info;
      END $$;
    `
  });
  console.log("Error returned:", error);
}

main();
