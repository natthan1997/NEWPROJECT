import fs from 'fs';

const filePath = 'components/pos/POSHistory.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `value={selectedDate.toISOString().split('T')[0]}`;
const replacement = `value={selectedDate.toLocaleDateString('en-CA')}`;

content = content.replace(target, replacement);
fs.writeFileSync(filePath, content);
console.log('fixed timezone string');
