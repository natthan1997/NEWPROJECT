import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const order_id = "ba226ae1-0aca-4538-b0ee-e52e205fbc41"
    const member_id = "859b759b-8400-4d91-ad64-4884158d896c"

    // 1. Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('pos_orders')
      .select('net_total, created_at, id')
      .eq('id', order_id)
      .single();
    
    console.log("order", order)

    const { data: orderItems } = await supabase
      .from('pos_order_items')
      .select('quantity, item:item_id(category_id, category:category_id(name))')
      .eq('order_id', order_id);
      
    console.log("orderItems", orderItems)

    const { data: missions } = await supabase
      .from('gamification_missions')
      .select('*')
      .eq('is_active', true)
      .or(`end_date.gt.${new Date().toISOString()},end_date.is.null`);

    console.log("missions count", missions?.length)
    
    let evaluatedCount = 0;
    
    for (const mission of missions || []) {
      const rules = mission.condition_rules || {};
      let isConditionMet = false;

      let incrementBy = 1;
      if (rules.type === 'order_item') {
         if (orderItems && rules.category) {
            let matchedQuantity = 0;
            for (const orderItem of orderItems) {
               const categoryName = (orderItem as any).item?.category?.name;
               if (categoryName && categoryName.toLowerCase() === rules.category.toLowerCase()) {
                  matchedQuantity += orderItem.quantity || 1;
               }
            }
            if (matchedQuantity > 0) {
               isConditionMet = true;
               incrementBy = matchedQuantity; 
            }
         }
      }
      
      console.log(`Mission ${mission.title} - isConditionMet: ${isConditionMet}, rules:`, rules)
      if (isConditionMet) evaluatedCount++;
    }
    
    console.log("evaluatedCount", evaluatedCount)
}
run()
