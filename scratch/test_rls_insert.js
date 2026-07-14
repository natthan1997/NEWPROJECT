const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use ANON key to simulate client-side request
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('pos_points_history').insert({
    member_id: "36884b18-ed44-463e-8e19-c52aa9a0b8dc",
    points: 1,
    points_change: 1,
    type: 'earn',
    description: 'Test anon insert',
    order_id: "685194a8-3203-4271-9e65-60205eace111" // some valid order id
  });
  
  console.log("Insert result:");
  console.log("Error:", error);
  console.log("Data:", data);
}

main();
