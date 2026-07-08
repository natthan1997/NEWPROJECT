const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: o, error: e1 } = await supabase.from('pos_orders').select('*').limit(1);
  console.log('pos_orders columns:', o && o.length ? Object.keys(o[0]) : e1);
  const { data: i, error: e2 } = await supabase.from('pos_order_items').select('*').limit(1);
  console.log('pos_order_items columns:', i && i.length ? Object.keys(i[0]) : e2);
  const { data: m, error: e3 } = await supabase.from('pos_members').select('*').limit(1);
  console.log('pos_members columns:', m && m.length ? Object.keys(m[0]) : e3);
  const { data: t, error: e4 } = await supabase.from('pos_loyalty_titles').select('*').limit(1);
  console.log('pos_loyalty_titles columns:', t && t.length ? Object.keys(t[0]) : e4);
}
run();
