const fs = require('fs');
const original = fs.readFileSync('.git/refs/heads/main', 'utf8'); // Wait no I want the file from HEAD
const execSync = require('child_process').execSync;
const file = execSync('git show HEAD:app/liff/member/page.tsx').toString();

let parenCount = 0;
let braceCount = 0;

for(let i=0; i<file.length; i++) {
    let char = file[i];
    if(char === '(') parenCount++;
    if(char === ')') parenCount--;
    if(char === '{') braceCount++;
    if(char === '}') braceCount--;
}

console.log("Original Paren: ", parenCount);
console.log("Original Brace: ", braceCount);
