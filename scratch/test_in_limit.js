const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testInLimit() {
  const startISO = '2026-07-01T00:00:00.000Z';
  const endISO = '2026-07-31T23:59:59.999Z';
  const { data: allOrders } = await supabase.from('pos_orders').select('id').gte('updated_at', startISO).lte('updated_at', endISO).in('status', ['paid', 'completed']);
  const orderIds = (allOrders || []).map(o => o.id);

  console.log(`Testing .in() query with ${orderIds.length} order IDs...`);

  const { data, error } = await supabase.from('pos_order_items').select('*').in('order_id', orderIds);
  console.log("Error from single .in() with 631 order IDs:", error);
  console.log("Data count from single .in() with 631 order IDs:", data?.length);
}

testInLimit();
