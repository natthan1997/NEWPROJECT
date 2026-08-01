require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: inv, error: invErr } = await supabase.from('inventory_items').select('*').ilike('name', '%ชีสพาย%')
  console.log('Inventory:', inv)
  
  const { data: menu, error: menuErr } = await supabase.from('menu_items').select('*').ilike('name_th', '%ชีสพาย%')
  console.log('Menu:', menu)
  
  const { data: rec, error: recErr } = await supabase.from('recipes').select('*')
  // We can filter recipes later if needed
}

run()
