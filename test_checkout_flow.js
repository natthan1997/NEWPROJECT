const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdjbzyrflzckjgxbqjqb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const { createClient } = require(path.join(process.cwd(), 'node_modules', '@supabase/supabase-js'));
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCheckoutFlow() {
  console.log("=== CHECKING POS SHIFTS & TABLES & POS_CHECKOUT_ORDER RPC ===");

  // 1. Active Shift
  const { data: shifts, error: shiftErr } = await supabase.from('pos_shifts').select('*').eq('status', 'open');
  console.log("Open Shifts:", shifts?.length, shiftErr || '');
  if (shifts && shifts.length > 0) {
    console.log("Active Shift:", shifts[0].id, "Staff ID:", shifts[0].staff_id);
  }

  // 2. Tables
  const { data: tables } = await supabase.from('pos_tables').select('id, table_number, status').limit(5);
  console.log("Sample Tables:", tables);

  // 3. Test RPC pos_checkout_order with dummy dry-run
  const testPayload = {
    order_action: 'insert',
    order: {
      order_number: 'TEST-CHECKOUT-001',
      staff_id: shifts && shifts[0] ? shifts[0].staff_id : null,
      shift_id: shifts && shifts[0] ? shifts[0].id : null,
      status: 'completed',
      total_amount: 55,
      net_total: 55,
      order_type: 'takeaway',
      paid_at: new Date().toISOString()
    },
    order_items: [],
    payments: [{ payment_method: 'cash', amount: 55, status: 'paid' }]
  };

  const { data: rpcRes, error: rpcErr } = await supabase.rpc('pos_checkout_order', { payload: testPayload });
  console.log("RPC Test Result:", rpcRes, "Error:", rpcErr);

  // Rollback / cleanup test order if created
  if (rpcRes && rpcRes.order_id) {
    await supabase.from('pos_orders').delete().eq('id', rpcRes.order_id);
    console.log("Cleaned up test order ID:", rpcRes.order_id);
  }
}

testCheckoutFlow();
