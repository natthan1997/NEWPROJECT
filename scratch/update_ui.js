import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Target 1: Dine-in button
const dineInTarget = `<Users size={14} /> {locale === 'en' ? ' กินที่ร้าน / Dine-in                   ' : locale === 'zh' ? ' กินที่ร้าน / Dine-in                   ' : ' กินที่ร้าน / Dine-in                   '}{selectedTable && (
                    <span className="ml-2 bg-emerald-500 px-1.5 py-0.5 text-[8px] text-white">
                      T-{selectedTable.table_number}
                    </span>
                  )}`;
const dineInReplacement = `<Users size={18} /> {selectedTable && (
                    <span className="ml-2 bg-emerald-500 px-1.5 py-0.5 text-[8px] text-white">
                      T-{selectedTable.table_number}
                    </span>
                  )}`;
content = content.replace(dineInTarget, dineInReplacement);

// Target 1: Takeaway button
const takeawayTarget = `<ShoppingBag size={14} /> {locale === 'en' ? ' กลับบ้าน / Takeaway ' : locale === 'zh' ? ' 外带 / Takeaway ' : ' กลับบ้าน / Takeaway '}`;
const takeawayReplacement = `<ShoppingBag size={18} />`;
content = content.replace(takeawayTarget, takeawayReplacement);

// Target 1: Delivery button
const deliveryTarget = /<Truck size={14} \/> \{locale === 'en' \? ' เดลิเวอรี่ \/ Delivery ' : locale === 'zh' \? ' 外卖 \/ Delivery ' : ' เดลิเวอรี่ \/ Delivery '\}/g;
const deliveryReplacement = `<Truck size={18} />`;
content = content.replace(deliveryTarget, deliveryReplacement);

// Target 2: Hold Bill button
const holdBillTarget = /' พักบิล \/ ส่งออเดอร์                 '/g;
const holdBillReplacement = `'พักบิล'`;
content = content.replace(holdBillTarget, holdBillReplacement);

fs.writeFileSync(filePath, content);
console.log("Updated POSTerminal.tsx UI");
