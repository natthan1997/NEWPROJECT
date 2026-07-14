const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('pos_inventory_audit_sessions').select('*').limit(1);
  if (data && data.length > 0) console.log(Object.keys(data[0]));
  else {
    const { data: cols } = await supabase.rpc('query', { query_text: "SELECT column_name FROM information_schema.columns WHERE table_name = 'pos_inventory_audit_sessions';" }).catch(()=>({}));
    console.log(cols || 'no rows');
  }
}
run();
