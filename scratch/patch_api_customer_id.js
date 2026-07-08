const fs = require('fs');
const path = 'app/api/liff/member/titles/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  ".eq('member_id', targetMemberId)",
  ".eq('customer_id', targetMemberId)"
);

fs.writeFileSync(path, code);
