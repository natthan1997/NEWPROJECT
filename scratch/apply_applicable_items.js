const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/["\s]/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY.replace(/["\s]/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
ALTER TABLE pos_loyalty_coupons ADD COLUMN IF NOT EXISTS applicable_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE pos_member_coupons ADD COLUMN IF NOT EXISTS applicable_items JSONB DEFAULT '[]'::jsonb;
`;

async function run() {
  const candidates = [
    { name: 'run_sql', queryParam: 'sql' },
    { name: 'run_sql', queryParam: 'query' },
    { name: 'run_sql', queryParam: 'sql_query' },
    { name: 'exec_sql', queryParam: 'sql' },
    { name: 'exec_sql', queryParam: 'query' },
    { name: 'exec_sql', queryParam: 'sql_query' },
    { name: 'execute_sql', queryParam: 'sql' },
    { name: 'execute_sql', queryParam: 'query' },
    { name: 'execute_sql', queryParam: 'sql_query' },
    { name: 'query', queryParam: 'query' },
    { name: 'query_sql', queryParam: 'query' }
  ];

  for (const candidate of candidates) {
    console.log(`Trying RPC: ${candidate.name} with parameter: ${candidate.queryParam}...`);
    const payload = {};
    payload[candidate.queryParam] = sql;
    const { data, error } = await supabase.rpc(candidate.name, payload);
    if (!error) {
      console.log(`✅ Success with ${candidate.name}! Result:`, data);
      return;
    } else {
      console.log(`❌ Failed ${candidate.name}: ${error.message} (code: ${error.code})`);
    }
  }
}
run();
