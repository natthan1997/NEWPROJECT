const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: route } = await supabase.from('pos_orders').select('*').eq('id', '3ed00be1-9cb4-4cbe-bdf9-fc0da42cf106').single();
  // We see payment method is transfer and no stripe_payment_intent_id.
  // Wait, if it was ordered via LIFF and paid via transfer... Stripe webhook won't trigger!
  console.log("Was this paid via Stripe?", route.payment_method === 'stripe' ? 'yes' : 'no');
}

main();
