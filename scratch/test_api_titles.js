const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n');
let supabaseUrl = '';
let supabaseKey = '';
env.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});
if (!supabaseUrl) supabaseUrl = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL='))?.split('=')[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: member } = await supabase.from('pos_members').select('*').limit(1).single();
    if (!member) return console.log('no member');
    
    console.log('Testing with member:', member.id);
    
    try {
        const { data: orders, error } = await supabase
          .from('pos_orders')
          .select('id, net_total, created_at, status')
          .eq('member_id', member.id)
          .eq('status', 'paid');
          
        console.log('Orders error:', error);
        console.log('Orders count:', orders?.length);
    } catch(err) {
        console.log(err);
    }
}
test();
