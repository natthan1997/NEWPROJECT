const fs = require('fs');
const target = 'app/api/liff/member/titles/route.ts';
let c = fs.readFileSync(target, 'utf8');

const searchOrderItems = `// Group items by order
    const itemsByOrder = orderItems.reduce((acc, item) => {
      acc[item.order_id] = (acc[item.order_id] || 0) + (item.quantity || 1);
      return acc;
    }, {});`;

const replaceOrderItems = `// Group items by order for party buyer
    const itemsByOrder = orderItems.reduce((acc, item) => {
      acc[item.order_id] = (acc[item.order_id] || 0) + (item.quantity || 1);
      return acc;
    }, {});

    // For same_menu_streak, we need the menu_item_id. Let's fetch it if it's missing in the query.
    // Wait, the current query is: select('order_id, quantity')
    // We need to update the query to select('order_id, quantity, menu_item_id, item_name')`;

// Wait, doing this via script replacement is tricky. I'll just rewrite the file content.
