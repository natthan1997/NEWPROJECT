const fs = require('fs');
const content = fs.readFileSync('app/liff/member/page.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  for (let j = 0; j < line.length; j++) {
    let char = line[j];
    if (char === '{') stack.push({char, line: i + 1});
    else if (char === '}') {
      let last = stack.pop();
      if (!last || last.char !== '{') console.log('Mismatched } at line ' + (i + 1));
    }
    else if (char === '(') stack.push({char, line: i + 1});
    else if (char === ')') {
      let last = stack.pop();
      if (!last || last.char !== '(') {
          console.log('Mismatched ) at line ' + (i + 1) + '. Expected ' + (last ? last.char : 'nothing') + ' to close.');
      }
    }
  }
}
console.log('Stack left:', stack);
