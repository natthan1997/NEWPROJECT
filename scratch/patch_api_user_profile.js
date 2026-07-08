const fs = require('fs');
const path = 'app/api/liff/member/titles/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const { data: profile } = await supabase.from('pos_user_profiles').select('member_id').eq('line_user_id', lineUserId).single();",
  "const { data: profile } = await supabase.from('pos_members').select('id').eq('line_user_id', lineUserId).single();"
);

code = code.replace(
  "if (!profile || !profile.member_id) {",
  "if (!profile || !profile.id) {"
);

code = code.replace(
  "targetMemberId = profile.member_id;",
  "targetMemberId = profile.id;"
);

fs.writeFileSync(path, code);
