import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: cols, error: e1 } = await supabase.from('pos_order_items').select('*').limit(1)
  console.log("pos_order_items:", cols)
  
  const { data: o, error: e2 } = await supabase.from('pos_orders').select('*').limit(1)
  console.log("pos_orders:", o)
}
run()
