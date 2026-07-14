const fs = require('fs');
const filePath = 'components/pos/POSTerminal.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// The bug is in handleProcessPayment where we push to movementsToInsert without checking if invItem exists.
// Let's replace both occurrences.

const target1 = `const { data: invItem } = await supabase.from('inventory_items').select('stock_quantity').eq('id', ing.ingredient_id).maybeSingle()
                movementsToInsert.push({
                  item_id: ing.ingredient_id,
                  change_amount: -usage,
                  new_quantity: invItem ? Number(invItem.stock_quantity) : 0,
                  reason: 'sale'
                })`;

const replace1 = `const { data: invItem } = await supabase.from('inventory_items').select('stock_quantity').eq('id', ing.ingredient_id).maybeSingle()
                if (invItem) {
                  movementsToInsert.push({
                    item_id: ing.ingredient_id,
                    change_amount: -usage,
                    new_quantity: Number(invItem.stock_quantity),
                    reason: 'sale'
                  })
                }`;

const target2 = `const { data: invItem } = await supabase.from('inventory_items').select('stock_quantity').eq('id', ing.ingredient_id).maybeSingle()
                    movementsToInsert.push({
                      item_id: ing.ingredient_id,
                      change_amount: -usage,
                      new_quantity: invItem ? Number(invItem.stock_quantity) : 0,
                      reason: 'sale'
                    })`;

const replace2 = `const { data: invItem } = await supabase.from('inventory_items').select('stock_quantity').eq('id', ing.ingredient_id).maybeSingle()
                    if (invItem) {
                      movementsToInsert.push({
                        item_id: ing.ingredient_id,
                        change_amount: -usage,
                        new_quantity: Number(invItem.stock_quantity),
                        reason: 'sale'
                      })
                    }`;

let newCode = code.replace(target1, replace1).replace(target2, replace2);

// Let's also remove the redundant order_items insert from handleHoldOrder that I noticed earlier!
const redundantInsertTarget = `	      const { error: itemsError } = await supabase.from('pos_order_items').insert(orderItems)
	      if (itemsError) throw itemsError`;

newCode = newCode.replace(redundantInsertTarget, `// pos_checkout_order handles pos_order_items automatically now`);

fs.writeFileSync(filePath, newCode, 'utf8');
console.log("Fixed POSTerminal.tsx");
