const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.development.local', 'utf8').split('\n');
let supabaseUrl = 'https://cdjbzyrflzckjgxbqjqb.supabase.co';
let supabaseKey = '';
env.forEach(line => {
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].replace(/["\s\\]/g, '').replace('rn', '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function patch() {
    const { data } = await supabase.from('pos_shop_settings').select('id, opening_hours').limit(1).single();
    if (data) {
        let oh = data.opening_hours || {};
        oh.loyalty_earn_rate = 50; // default to 50 for testing
        const { error } = await supabase.from('pos_shop_settings').update({ opening_hours: oh }).eq('id', data.id);
        console.log('Updated:', error ? error : 'Success');
    }
}
patch();
