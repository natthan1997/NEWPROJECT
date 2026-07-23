const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  "https://cdjbzyrflzckjgxbqjqb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkamJ6eXJmbHpja2pneGJxanFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTk3OTgsImV4cCI6MjA4NzIzNTc5OH0.kBFsmHTZuhWheVnX1rXL26BL0kIBka-DE__648Aue18"
);

async function run() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const { data: maxData, error } = await supabase
      .from('pos_orders')
      .select('id, queue_number, created_at, branch_id')
      .gte('created_at', startOfToday.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
      
    console.log("Error:", error);
    console.log("Data:", maxData);
}
run();
