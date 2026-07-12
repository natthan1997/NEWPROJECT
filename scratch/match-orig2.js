const execSync = require('child_process').execSync;
const file = execSync('git show HEAD:app/liff/member/page.tsx').toString();

const returnIndex = file.indexOf('  return (');
const beforeReturn = file.substring(0, returnIndex);

let stack = [];
for(let i=0; i<beforeReturn.length; i++) {
    let char = beforeReturn[i];
    if(char === '(' || char === '{') stack.push({char, i});
    else if(char === ')') {
        if(stack.length && stack[stack.length-1].char === '(') stack.pop();
    }
    else if(char === '}') {
        if(stack.length && stack[stack.length-1].char === '{') stack.pop();
    }
}

console.log(stack.map(s => s.char + ' at ' + file.substring(Math.max(0, s.i-20), s.i+20)).join('\n'));
