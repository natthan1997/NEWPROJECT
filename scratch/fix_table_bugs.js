import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the top bar buttons to not show the "Change Order Type" popup when already in that type.
// We will replace the onClick logic for dine_in.

const dineInRegex = /onClick=\{\(\) => \{\s*if \(editingOrderId\) \{\s*setPendingOrderTypeSwitch\('dine_in'\);\s*\} else \{\s*setOrderType\('dine_in'\);\s*fetchTables\(\)\s*setShowTableModal\(true\)\s*\}\s*\}\}/;

if (content.match(dineInRegex)) {
    content = content.replace(dineInRegex, `onClick={() => {
                    if (orderType === 'dine_in') {
                        fetchTables();
                        setShowTableModal(true);
                    } else if (editingOrderId) {
                        setPendingOrderTypeSwitch('dine_in');
                    } else {
                        setOrderType('dine_in');
                        fetchTables();
                        setShowTableModal(true);
                    }
                  }}`);
} else {
    console.log("Could not find dine_in button regex");
}

const takeawayRegex = /onClick=\{\(\) => \{\s*if \(editingOrderId\) \{\s*setPendingOrderTypeSwitch\('takeaway'\);\s*\} else \{\s*setOrderType\('takeaway'\);\s*setSelectedTable\(null\)\s*\}\s*\}\}/;
if (content.match(takeawayRegex)) {
    content = content.replace(takeawayRegex, `onClick={() => {
                    if (orderType === 'takeaway') return;
                    if (editingOrderId) {
                        setPendingOrderTypeSwitch('takeaway');
                    } else {
                        setOrderType('takeaway');
                        setSelectedTable(null);
                    }
                  }}`);
}

const deliveryRegex = /onClick=\{\(\) => \{\s*if \(editingOrderId\) \{\s*setPendingOrderTypeSwitch\('delivery'\);\s*\} else \{\s*setOrderType\('delivery'\);\s*setSelectedTable\(null\);\s*openDeliveryPlatformModal\(deliveryPlatform \|\| activeDeliveryPlatforms\[0\] \|\| 'grab'\);\s*\}\s*\}\}/;
if (content.match(deliveryRegex)) {
    content = content.replace(deliveryRegex, `onClick={() => {
                    if (orderType === 'delivery') {
                        openDeliveryPlatformModal(deliveryPlatform || activeDeliveryPlatforms[0] || 'grab');
                        return;
                    }
                    if (editingOrderId) {
                        setPendingOrderTypeSwitch('delivery');
                    } else {
                        setOrderType('delivery');
                        setSelectedTable(null);
                        openDeliveryPlatformModal(deliveryPlatform || activeDeliveryPlatforms[0] || 'grab');
                    }
                  }}`);
}

// 2. Fix the merge logic to combine totals and update the table_number label on the order
const mergeRegex = /const \{ data: currentItems \} = await supabase\.from\('pos_order_items'\)\.select\('\*'\)\.eq\('order_id', editingOrderId\);[\s\S]*?if \(currentItems && currentItems\.length > 0\) \{/m;

const mergeMatch = content.match(mergeRegex);
if (mergeMatch) {
    const mergeReplacement = `const { data: oldOrderData } = await supabase.from('pos_orders').select('*').eq('id', editingOrderId).single();
                                                    
                                                    if (oldOrderData) {
                                                        const newTotal = Number(targetOrder.total || 0) + Number(oldOrderData.total || 0);
                                                        const newSubtotal = Number(targetOrder.subtotal || 0) + Number(oldOrderData.subtotal || 0);
                                                        const newTax = Number(targetOrder.tax || 0) + Number(oldOrderData.tax || 0);
                                                        const newServiceCharge = Number(targetOrder.service_charge || 0) + Number(oldOrderData.service_charge || 0);
                                                        
                                                        const mergedTableNumber = targetOrder.table_number?.includes(oldOrderData.table_number) 
                                                            ? targetOrder.table_number 
                                                            : (targetOrder.table_number + ' + ' + oldOrderData.table_number);

                                                        await supabase.from('pos_orders').update({
                                                            subtotal: newSubtotal,
                                                            tax: newTax,
                                                            service_charge: newServiceCharge,
                                                            total: newTotal,
                                                            table_number: mergedTableNumber
                                                        }).eq('id', targetOrder.id);
                                                    }

                                                    const { data: currentItems } = await supabase.from('pos_order_items').select('*').eq('order_id', editingOrderId);
                                                    
                                                    if (currentItems && currentItems.length > 0) {`;
    
    content = content.replace(mergeRegex, mergeReplacement);
} else {
    console.log("Could not find merge logic regex");
}

fs.writeFileSync(filePath, content);
console.log("Successfully fixed table bugs.");
