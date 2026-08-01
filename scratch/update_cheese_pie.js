require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const itemId = 'bacbb9e0-47bd-4912-a9e1-0bfd28c75729'
  console.log('Attempting to update cheese pie to stock_quantity: 10')
  const { data, error } = await supabase.from('inventory_items').update({ stock_quantity: 10 }).eq('id', itemId).select()
  console.log('Error:', error)
  console.log('Data:', data)
}

run()
