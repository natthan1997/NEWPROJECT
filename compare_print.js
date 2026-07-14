const fs = require('fs');
const execSync = require('child_process').execSync;

const original = execSync('git show de2dbf8b80203532601d7046f8326176b09bad9b:components/pos/POSTerminal.tsx').toString();
const current = fs.readFileSync('components/pos/POSTerminal.tsx', 'utf8');

function extract(code) {
  const match = code.match(/const executeNativePrint = async.*?try \{/s);
  if (!match) return "Not found";
  const start = match.index;
  const end = code.indexOf('catch (e: any)', start);
  return code.substring(start, end);
}

console.log("--- ORIGINAL ---");
console.log(extract(original).substring(2000, 4000));
console.log("--- CURRENT ---");
console.log(extract(current).substring(2000, 4000));
