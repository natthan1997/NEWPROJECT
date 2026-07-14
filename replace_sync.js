const fs = require('fs');
const filePath = 'components/pos/POSOfflineSync.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStartStr = `const { order: orderData, items, payments } = payload`;
const targetEndStr = `if (paymentsError) throw paymentsError
        }`;

const replacement = `const { order: orderData, items, payments } = payload
        
        const rpcPayload = {
          order_action: 'insert',
          order: orderData,
          order_items: items,
          payments: payments
        }
        
        const { error: rpcError } = await supabase.rpc('pos_checkout_order', { payload: rpcPayload })
        if (rpcError) throw rpcError`;

const startIndex = content.indexOf(targetStartStr);
const endIndex = content.indexOf(targetEndStr);

if (startIndex === -1 || endIndex === -1) {
  console.error("Targets not found");
  process.exit(1);
}

content = content.substring(0, startIndex) + replacement + content.substring(endIndex + targetEndStr.length);
fs.writeFileSync(filePath, content);
console.log("Replaced POSOfflineSync");
