const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../components/pos/POSCategoryManager.tsx');
const destPath = path.join(__dirname, '../components/pos/POSInventoryCategoryManager.tsx');

let code = fs.readFileSync(srcPath, 'utf8');

code = code.replace(/pos_menu_categories/g, 'inventory_categories');
code = code.replace(/pos_menu_items/g, 'inventory_items');
code = code.replace(/POSCategoryManager/g, 'POSInventoryCategoryManager');

fs.writeFileSync(destPath, code);
console.log('Created POSInventoryCategoryManager.tsx');
