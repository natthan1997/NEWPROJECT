import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: orderItems } = await supabase
      .from('pos_order_items')
      .select('quantity, item:item_id(category_id, category:category_id(name))')
      .eq('order_id', "ba226ae1-0aca-4538-b0ee-e52e205fbc41");
  console.log(JSON.stringify(orderItems, null, 2))
}
run()
