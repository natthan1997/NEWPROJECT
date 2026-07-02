import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace("Motorcycle", "Bike"); // Fix import
content = content.replace("<Motorcycle size={18} />", "<Bike size={18} />"); // Fix usage

fs.writeFileSync(filePath, content);
console.log("Fixed Motorcycle to Bike");
