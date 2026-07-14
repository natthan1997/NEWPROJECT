const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cols } = await supabase.from('pos_orders').select('*').eq('id', '3ed00be1-9cb4-4cbe-bdf9-fc0da42cf106').single();
  console.log("Order DEL#260714-8043 (120 total, 60 fee):");
  console.log("Status:", cols.status);
  console.log("Payment method:", cols.payment_method);
  console.log("Paid at:", cols.paid_at);
}

main();
