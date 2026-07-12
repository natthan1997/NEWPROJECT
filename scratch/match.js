const fs = require('fs');
const code = fs.readFileSync('app/liff/member/page.tsx', 'utf8');

let parenCount = 0;
let braceCount = 0;
let angleCount = 0;

for(let i=0; i<code.length; i++) {
    let char = code[i];
    if(char === '(') parenCount++;
    if(char === ')') parenCount--;
    if(char === '{') braceCount++;
    if(char === '}') braceCount--;
}

console.log("Paren: ", parenCount);
console.log("Brace: ", braceCount);
