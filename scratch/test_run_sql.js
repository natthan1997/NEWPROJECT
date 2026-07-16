require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/create_member_checkins.sql'), 'utf8');

  // Try candidate 1: run_sql with sql_query
  console.log('Trying run_sql(sql_query)...');
  const res1 = await supabase.rpc('run_sql', { sql_query: sql });
  console.log('Result 1:', JSON.stringify(res1, null, 2));

  // Try candidate 2: run_sql with sql
  if (res1.error) {
    console.log('Trying run_sql(sql)...');
    const res2 = await supabase.rpc('run_sql', { sql: sql });
    console.log('Result 2:', JSON.stringify(res2, null, 2));
  }
})();
