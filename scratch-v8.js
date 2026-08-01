require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('pos_orders').select('id, status, created_at, order_number, table_number, order_type').order('created_at', { ascending: false }).limit(5).then(res => console.log(JSON.stringify(res.data, null, 2))).catch(console.error);
