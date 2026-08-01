require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('pos_orders').select('*').limit(1).then(res => console.log(JSON.stringify(res.data[0], null, 2))).catch(console.error);
