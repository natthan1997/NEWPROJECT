const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.development.local', 'utf8').split('\n');
let supabaseUrl = '';
let supabaseKey = '';
env.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].replace(/["\r\n\s\\]/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].replace(/["\r\n\s\\]/g, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const data = {
        name: 'Test Title',
        rule_type: 'total_visits',
        rule_threshold: 1,
        is_active: true
    };
    const { data: res, error } = await supabase.from('pos_loyalty_titles').insert([data]).select();
    console.log('Result:', res);
    console.log('Error:', error);
}
test();
