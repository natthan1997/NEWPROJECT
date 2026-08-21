const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAll() {
    const { data: tables, error } = await supabase.from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error || !tables) {
        console.log("Could not fetch tables");
        return;
    }
    
    for (const row of tables) {
        const { count } = await supabase.from(row.table_name).select('*', { count: 'exact', head: true });
        if (count > 0) {
            console.log(row.table_name, count);
        }
    }
}
checkAll();
