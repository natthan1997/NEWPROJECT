const fs = require('fs');
const original = fs.readFileSync('app/liff/member/page.tsx', 'utf8');
const returnIndex = original.indexOf('  return (');
const beforeReturn = original.substring(0, returnIndex);

let parenCount = 0;
let braceCount = 0;

for(let i=0; i<beforeReturn.length; i++) {
    let char = beforeReturn[i];
    if(char === '(') parenCount++;
    if(char === ')') parenCount--;
    if(char === '{') braceCount++;
    if(char === '}') braceCount--;
}

console.log("Paren: ", parenCount);
console.log("Brace: ", braceCount);
