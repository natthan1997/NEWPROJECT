const fs = require('fs');
const target = 'app/liff/member/page.tsx';
let c = fs.readFileSync(target, 'utf8');

const search = `if (campData && !campError) {`;
const replace = `if (campData && !campError && campData.length > 0) {`;

c = c.replace(search, replace);
fs.writeFileSync(target, c);
console.log('Fixed campaign fallback');
