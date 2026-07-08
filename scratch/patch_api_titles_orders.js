const fs = require('fs');
const path = 'app/api/liff/member/titles/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const { data: orders, error: ordersError } = await supabase",
  "let orders = [];\n    if (targetMemberId) {\n      const { data, error } = await supabase"
);
code = code.replace(
  ".eq('status', 'paid');\n\n    if (ordersError) throw ordersError;",
  ".eq('status', 'paid');\n      if (error) throw error;\n      orders = data || [];\n    }"
);

fs.writeFileSync(path, code);
