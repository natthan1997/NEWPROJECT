const fs = require('fs');
const content = fs.readFileSync('/Users/chenchirawongpothisan/Downloads/XYL to .com/components/pos/POSTerminal.tsx', 'utf8');

const lines = content.split('\n');

const stack = [];

// A set of tags we know are actual JSX tags in this file
const jsxTags = new Set([
  'div', 'span', 'button', 'motion.div', 'AnimatePresence', 'QrCode', 'ShoppingBag', 
  'CheckCircle2', 'POSPinModal', 'POSRecipeViewModal', 'option', 'select', 'label', 
  'svg', 'polyline', 'Check', 'Printer', 'Search', 'Users', 'ChevronDown', 
  'Banknote', 'CreditCard', 'X', 'img', 'h2', 'h3', 'h4', 'p', 'input', 'br', 'hr',
  'style', 'rect', 'line', 'circle', 'path'
]);

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  
  let i = 0;
  while (i < line.length) {
    if (line[i] === ' ') { i++; continue; }
    
    // Check for comment
    if (line[i] === '/' && line[i+1] === '/') break;
    
    if (line[i] === '<') {
      const rest = line.slice(i);
      
      // 1. Closing tag? </TagName>
      const closeMatch = rest.match(/^<\/([a-zA-Z0-9\._\-]+)>/);
      if (closeMatch) {
        const tagName = closeMatch[1];
        if (jsxTags.has(tagName)) {
          if (stack.length === 0) {
            console.log(`Error on Line ${lineIdx + 1}: Extra closing tag </${tagName}> found!`);
          } else {
            const lastOpen = stack.pop();
            if (lastOpen.name !== tagName) {
              console.log(`Error on Line ${lineIdx + 1}: Mismatched closing tag </${tagName}>! Expected </${lastOpen.name}> (opened on Line ${lastOpen.line})`);
              stack.push(lastOpen);
            }
          }
        }
        i += closeMatch[0].length;
        continue;
      }
      
      // 2. Opening tag? <TagName ...> or <TagName ... />
      const openMatch = rest.match(/^<([a-zA-Z0-9\._\-]+)([^>]*?)(\/?)>/);
      if (openMatch) {
        const tagName = openMatch[1];
        if (jsxTags.has(tagName)) {
          const isSelfClosing = openMatch[3] === '/' || ['img', 'input', 'br', 'hr'].includes(tagName.toLowerCase());
          if (!isSelfClosing) {
            stack.push({ name: tagName, line: lineIdx + 1 });
          }
        }
        i += openMatch[0].length;
        continue;
      }
    }
    
    i++;
  }
}

console.log('Finished parsing.');
if (stack.length > 0) {
  console.log('Unclosed tags remaining in stack:');
  stack.forEach(t => console.log(`- <${t.name}> opened on Line ${t.line}`));
} else {
  console.log('All JSX tags balanced!');
}
