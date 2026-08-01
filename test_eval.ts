import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('pos_orders').select('*').ilike('order_number', '%TAK#260730-K0IL%').limit(1)
  console.log("pos_orders:", data)
  
  if (data && data.length > 0) {
    const order_id = data[0].id
    const member_id = data[0].customer_id || data[0].line_user_id || '90b1dc6a-35bb-41a4-afc3-dfc5bc56d95f'
    console.log(`Running evaluation for order: ${order_id} and member: ${member_id}`)
    
    // hit local api or write logic directly... let's just show order_id and member_id
  }
}
run()
