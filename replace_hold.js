const fs = require('fs');

const filePath = 'components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStartStr = `if (editingOrderId) {
	        const { data: existingRows, error: existingRowsError } = await supabase
	          .from('pos_order_items')
	          .select(\`*, item:pos_menu_items!item_id(*)\`)
	          .eq('order_id', editingOrderId)`;
const targetEndStr = `finalOrderId = newOrder.id
	        }
		      }`;

const startIndex = content.indexOf(targetStartStr);
const endIndex = content.indexOf(targetEndStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find targets");
  process.exit(1);
}

const replacement = `if (editingOrderId) {
          const { data: existingRows, error: existingRowsError } = await supabase
            .from('pos_order_items')
            .select(\`*, item:pos_menu_items!item_id(*)\`)
            .eq('order_id', editingOrderId)
          if (existingRowsError) throw existingRowsError
          existingComparableItems = (existingRows || []).map((row: any) => ({
            id: row.item_id,
            item_id: row.item_id,
            name: row.item?.name || 'Unknown Item',
            quantity: row.quantity,
            selected_modifiers: row.selected_modifiers || [],
            category_id: row.item?.category_id || 'uncategorized',
          }))

          const newItems = computeNewCartItems(cart, existingComparableItems)
          if (newItems.length === 0) {
            throw new Error('บิลนี้พักไว้แล้ว กรุณาเพิ่มรายการใหม่ก่อนส่งออเดอร์เพิ่ม')
          }

          const identity = await requestOrderIdentity(editingOrderId)
          finalOrderNumber = identity.orderNumber
          finalQueueNumber = identity.queueNumber
        } else {
          const identity = await requestOrderIdentity()
          finalOrderNumber = identity.orderNumber
          finalQueueNumber = identity.queueNumber
        }

        const payload: any = {
          order_action: editingOrderId ? 'update' : 'insert',
          order_id: editingOrderId || undefined,
          order: {
            order_number: finalOrderNumber,
            staff_id: profile?.id,
            shift_id: activeShift?.id,
            branch_id: shopSettings?.branch_id || activeShift?.branch_id || null,
            status: 'pending',
            total_amount: rawCartSubTotal,
            net_total: cartTotal,
            tax_amount: vatAmount,
            service_charge_amount: serviceChargeAmount,
            discount_amount: discountTotalValue + itemDiscountTotal,
            customer_id: selectedCustomer?.id,
            order_type: orderType,
            table_id: selectedTable?.id,
            table_number: selectedTable?.table_number,
            queue_number: finalQueueNumber,
            order_source: 'pos',
            paid_at: null,
            delivery_platform: orderType === 'delivery' ? deliveryPlatform : null,
            delivery_gp_amount: 0,
            reference_name: orderType === 'delivery' && platformOrderId ? platformOrderId.trim() : null,
          },
          order_items: cart.map(item => {
            const modsPrice = item.selected_modifiers?.reduce((a: number, m: any) => a + ((m.price_adjustment || 0) * (m.qty || 1)), 0) || 0;
            return {
              item_id: item.id,
              quantity: item.quantity,
              unit_price: getEffectiveItemUnitPrice(item),
              cost_price: item.cost_price || 0,
              subtotal: ((getEffectiveItemUnitPrice(item) + modsPrice) * item.quantity) - (item.discount_amount || 0),
              selected_modifiers: item.selected_modifiers,
              customer_name: item.customer_name || 'ลูกค้า',
              discount_amount: item.discount_amount || 0,
              discount_reason: item.discount_reason || null,
            }
          })
        };

        const { data: rpcResult, error: rpcError } = await supabase.rpc('pos_checkout_order', { payload });
        
        if (rpcError) {
          console.error('RPC HoldOrder Error:', rpcError);
          throw rpcError;
        }

        finalOrderId = rpcResult?.order_id || editingOrderId;`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex + targetEndStr.length);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Replacement hold complete");
