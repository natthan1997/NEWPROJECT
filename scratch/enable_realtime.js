const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let envUrl = '';
try {
    const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    const match = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    if (match) envUrl = match[1].replace(/["']/g, '').trim();
} catch (e) {}

let envKey = '';
try {
    const envLocal = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    const matchLocal = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
    if (matchLocal) envKey = matchLocal[1].replace(/["']/g, '').trim();
} catch (e) {}

if (!envUrl || !envKey) {
    console.log('Missing env variables', { url: envUrl, key: !!envKey });
    process.exit(1);
}

const supabase = createClient(envUrl, envKey);

async function enableRealtime() {
  const sql = `
    BEGIN;
    -- Drop publication if it exists to recreate it cleanly, or just add to it
    -- Supabase default realtime publication is "supabase_realtime"
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_members;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_points_history;
    COMMIT;
  `;
  
  // We can use an RPC 'execute_sql' if it exists. If not, we might fail.
  const { data, error } = await supabase.rpc('execute_sql', { sql });
  console.log('Result:', data, error);
}

enableRealtime();
