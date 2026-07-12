const fs = require('fs');
const code = fs.readFileSync('app/liff/member/page.tsx', 'utf8');
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
