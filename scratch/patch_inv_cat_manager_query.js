const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/POSInventoryCategoryManager.tsx');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  ".select('*, inventory_items(count)')",
  ".select('*')"
);

code = code.replace(
  "item_count: c.inventory_items?.[0]?.count || 0",
  "item_count: 0"
);

fs.writeFileSync(filePath, code);
