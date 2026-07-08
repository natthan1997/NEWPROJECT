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
    const { data, error } = await supabase.from('pos_shop_settings').select('id, branch_id, opening_hours');
    if (data) {
        data.forEach(d => {
            console.log(`ID: ${d.id}, Branch: ${d.branch_id}, Earn: ${d.opening_hours?.loyalty_earn_rate}, Redeem: ${d.opening_hours?.loyalty_points_per_thb}`);
        });
    }
}
test();
