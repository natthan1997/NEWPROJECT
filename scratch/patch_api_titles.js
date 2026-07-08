const fs = require('fs');
const path = 'app/api/liff/member/titles/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "let targetMemberId = memberId;",
  "let targetMemberId = null;\n    if (memberId && memberId.includes('-')) { targetMemberId = memberId; }"
);

fs.writeFileSync(path, code);
