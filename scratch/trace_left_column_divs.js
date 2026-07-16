const fs = require('fs');
const content = fs.readFileSync('/Users/chenchirawongpothisan/Downloads/XYL to .com/components/pos/POSTerminal.tsx', 'utf8');

const lines = content.split('\n');

let openDivs = [];
let closedDivs = [];

for (let lineIdx = 5623; lineIdx <= 5711; lineIdx++) {
  const line = lines[lineIdx];
  if (!line) continue;
  
  // Find open div tags
  // Skip comments and self-closing tags
  let lineText = line.replace(/\{\/\*.*?\*\/\}/g, ''); // strip inline comments
  
  const openMatches = lineText.match(/<div(?![^>]*\/>)[^>]*>/g) || [];
  const closeMatches = lineText.match(/<\/div>/g) || [];
  
  openMatches.forEach(m => openDivs.push({ line: lineIdx + 1, match: m }));
  closeMatches.forEach(m => closedDivs.push({ line: lineIdx + 1, match: m }));
}

console.log('--- OPENING DIVS ---');
openDivs.forEach(d => console.log(`Line ${d.line}: ${d.match}`));

console.log('--- CLOSING DIVS ---');
closedDivs.forEach(d => console.log(`Line ${d.line}: ${d.match}`));

console.log('Total Open:', openDivs.length);
console.log('Total Closed:', closedDivs.length);
