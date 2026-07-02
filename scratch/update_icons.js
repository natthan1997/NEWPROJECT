import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add Utensils, Bike/Motorcycle imports
content = content.replace("Truck,", "Truck,\n  Utensils,\n  Motorcycle,");

// Update Dine-in Button
const dineInRegex = /<Users size=\{18\} \/> \{selectedTable && \(\s*<span className="ml-2 bg-emerald-500 px-1\.5 py-0\.5 text-\[8px\] text-white">\s*T-\{selectedTable\.table_number\}\s*<\/span>\s*\)\}/m;
const dineInReplacement = `<Utensils size={18} /> {selectedTable && (
                    <span className="ml-2 bg-emerald-500 px-1.5 py-0.5 text-[8px] text-white">
                      T-{selectedTable.table_number}
                    </span>
                  )}`;
content = content.replace(dineInRegex, dineInReplacement);

// Update Takeaway Button
const takeawayRegex = /<ShoppingBag size=\{18\} \/>/m;
const takeawayReplacement = `<ShoppingBag size={18} />`;
content = content.replace(takeawayRegex, takeawayReplacement); // Same icon, just confirming

// Update Delivery Button
const deliveryRegex = /<Truck size=\{14\} \/> \{locale === 'en' \? ' เดลิเวอรี่ \/ Delivery ' : locale === 'zh' \? ' 外卖 \/ Delivery ' : ' เดลิเวอรี่ \/ Delivery '\}/m;
const deliveryReplacement = `<Motorcycle size={18} />`;
content = content.replace(deliveryRegex, deliveryReplacement);

fs.writeFileSync(filePath, content);
console.log("Updated icons");
