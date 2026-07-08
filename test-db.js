const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://cdjbzyrflzckjgxbqjqb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkamJ6eXJmbHpja2pneGJxanFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTk3OTgsImV4cCI6MjA4NzIzNTc5OH0.kBFsmHTZuhWheVnX1rXL26BL0kIBka-DE__648Aue18'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('pos_menu_items').select('name, image_url').limit(5)
  console.log(data, error)
}
run()
