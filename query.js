const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('attendance_logs').select('*').limit(1);
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    // try to get table columns using postgres query
    const { data: cols, error: cErr } = await supabase.rpc('query', { query_text: "SELECT column_name FROM information_schema.columns WHERE table_name = 'attendance_logs';" }).catch(()=>({}));
    console.log(cols || 'no rows, need psql');
  }
}
run();
