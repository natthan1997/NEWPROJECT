require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('recipes').select('*').limit(1)
  console.log('Keys:', data && data.length > 0 ? Object.keys(data[0]) : 'no data')
  
  const { data: rec, error: recErr } = await supabase.from('recipes').select('*').eq('ingredient_id', 'bacbb9e0-47bd-4912-a9e1-0bfd28c75729')
  console.log('Recipes for Cheese Pie ingredient:', rec)
}

run()
