const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Query foreign key constraint for inventory_movements
  // Actually we can just query a movement to see what it requires. Or maybe query the table structure?
  const { data, error } = await supabase.from('inventory_movements').select('*').limit(1);
  console.log("Movements data:", data);
  console.log("Error:", error);
}
run();
