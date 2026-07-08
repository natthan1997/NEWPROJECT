const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.development.local', 'utf8').split('\n');
let supabaseUrl = 'https://cdjbzyrflzckjgxbqjqb.supabase.co';
let supabaseKey = '';
env.forEach(line => {
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].replace(/["\s\\]/g, '').replace('rn', '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: profile } = await supabase.from('pos_members').select('id').limit(1).single();
    console.log('Profile:', profile);
    
    const { data: shopSettings } = await supabase.from('pos_shop_settings').select('opening_hours').limit(1).maybeSingle();
    console.log('shopSettings:', shopSettings);
}
test();
