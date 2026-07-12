const fs = require('fs');
const original = fs.readFileSync('app/liff/member/page.tsx', 'utf8');
const lines = original.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
