const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('pos_checkout_order', { payload: {
    order_action: "insert",
    order: {
      order_number: "TEST-123",
      table_id: null,
      table_number: null,
      net_total: 100,
      total_amount: 100,
      discount_amount: 10,
      promo_code: "โปรโมชั่น/ส่วนลด",
      branch_id: "7d0d0f66-1c4b-449f-b98f-0158a18359b3"
    },
    items: [],
    payments: []
  } });
  console.log("Data:", data, "Error:", error);
}
run();
