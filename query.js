const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Let's create a policy that allows EVERYONE to SELECT, INSERT, UPDATE, DELETE pos_campaigns
  const p1 = await supabase.rpc('query', { query_text: `
    DROP POLICY IF EXISTS "Enable read access for all users" ON pos_campaigns;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON pos_campaigns;
    CREATE POLICY "Enable read access for all users" ON pos_campaigns FOR SELECT USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON pos_campaigns FOR ALL USING (auth.role() = 'authenticated');
  `}).catch(e => e);
  console.log("Policies updated via RPC?", p1);
}
run();
