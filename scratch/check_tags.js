const fs = require('fs');
const path = require('path');

const filePath = '/Users/chenchirawongpothisan/Downloads/XYL to .com/components/pos/POSTerminal.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log('Total lines:', lines.length);

// Let's find the start of the success modal
const startLine = lines.findIndex(l => l.includes('GLOBAL PAYMENT SUCCESS MODAL'));
console.log('Success modal starts at line:', startLine + 1);

// Let's look at lines from startLine to 5220
let openDivs = 0;
let closedDivs = 0;

for (let i = startLine; i < 5220; i++) {
  const line = lines[i];
  if (!line) continue;
  
  // Count opening div tags (excluding self-closing ones like <div />)
  const openMatches = line.match(/<div(?![^>]*\/>)[^>]*>/g) || [];
  // Count closing div tags
  const closeMatches = line.match(/<\/div>/g) || [];
  
  openDivs += openMatches.length;
  closedDivs += closeMatches.length;
  
  if (openMatches.length > 0 || closeMatches.length > 0) {
    console.log(`Line ${i + 1}: ${line.trim()} | Open: +${openMatches.length}, Close: +${closeMatches.length} | Net: ${openDivs - closedDivs}`);
  }
}

console.log('Total Open divs:', openDivs);
console.log('Total Closed divs:', closedDivs);
console.log('Net (should be 0 if balanced inside this block):', openDivs - closedDivs);
