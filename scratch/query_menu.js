require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: menu, error: menuErr } = await supabase.from('menu_items').select('*').ilike('name_th', '%ชีส%')
  console.log('Menu:', menu?.map(m => ({ id: m.id, name_th: m.name_th, name_en: m.name_en })))
}

run()
