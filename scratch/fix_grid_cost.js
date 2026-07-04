import fs from 'fs';

const filePath = 'components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `<span className="text-[11px] font-bold text-gray-700">฿ {item.cost_price || 0}</span>`;
const replacement = `<span className="text-[11px] font-bold text-gray-700">฿ {Number(item.cost_price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Fixed grid cost formatting');
} else {
    console.log('Target not found for grid cost');
}
