const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.development.local', 'utf8').split('\n');
let supabaseUrl = '';
let supabaseKey = '';
env.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.substring(line.indexOf('=') + 1).trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.substring(line.indexOf('=') + 1).trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: titles, error } = await supabase.from('pos_loyalty_titles').select('*');
    console.log('Titles:', titles);
    console.log('Error:', error);
}
test();
