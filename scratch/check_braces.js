const fs = require('fs');
const filePath = '/Users/chenchirawongpothisan/Downloads/XYL to .com/components/pos/POSTerminal.tsx';
const content = fs.readFileSync(filePath, 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;

let inString = false;
let stringChar = '';
let inComment = false;
let blockComment = false;

const lines = content.split('\n');

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inComment) {
      if (char === '\n') inComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && nextChar === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (char === stringChar && line[i - 1] !== '\\') inString = false;
      continue;
    }
    
    if (char === '/' && nextChar === '/') {
      inComment = true;
      i++;
      continue;
    }
    if (char === '/' && nextChar === '*') {
      blockComment = true;
      i++;
      continue;
    }
    
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }
    
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }
  
  if (lineIdx + 1 >= 5600 && lineIdx + 1 <= 5794) {
    console.log(`Line ${lineIdx + 1}: ${line.trim()} | Braces: ${braces}, Parens: ${parens}, Brackets: ${brackets}`);
  }
}
