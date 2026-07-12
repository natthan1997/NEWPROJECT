const fs = require('fs');
const original = fs.readFileSync('app/liff/member/page.tsx', 'utf8');
const returnIndex = original.indexOf('\n  return (\n    <div');
console.log('Return index:', returnIndex);
