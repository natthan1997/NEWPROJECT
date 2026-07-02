import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/app/menu/[table_id]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/refreshShopAvailability\(table\?\.branch_id\)/g, "refreshShopAvailability(table?.branch_id, table)");
content = content.replace(/refreshShopAvailability\(table\.branch_id\)/g, "refreshShopAvailability(table.branch_id, table)");

fs.writeFileSync(filePath, content);
console.log("Fixed refreshShopAvailability calls");
