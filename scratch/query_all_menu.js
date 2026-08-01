require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: menu, error: menuErr } = await supabase.from('pos_menu_items').select('*').ilike('name_th', '%ชีสพาย%')
  console.log('Menu Error:', menuErr)
  console.log('Menu Items:', menu?.map(m => ({ id: m.id, name: m.name_th, category_id: m.category_id, is_active: m.is_active })))
  
  if (menu && menu.length > 0) {
    const { data: rec } = await supabase.from('pos_recipes').select('*').eq('menu_item_id', menu[0].id)
    console.log('Recipes for', menu[0].name_th, ':', rec)
  }
}

run()
