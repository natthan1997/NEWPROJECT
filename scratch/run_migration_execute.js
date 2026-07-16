require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const sqlFilePath = path.join(__dirname, '../migrations/create_member_checkins.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  console.log('🚀 Executing migration via execute_sql RPC...');
  const { data, error } = await supabase.rpc('execute_sql', { sql });
  console.log('Result:', JSON.stringify({ data, error }, null, 2));
})();
