const fs = require('fs');
const path = 'app/liff/member/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const { data: shopSettings } = await supabase.from('pos_shop_settings').select('loyalty_earn_rate').limit(1).maybeSingle();",
  "const { data: shopSettings } = await supabase.from('pos_shop_settings').select('opening_hours').limit(1).maybeSingle();"
);

code = code.replace(
  "if (shopSettings && shopSettings.loyalty_earn_rate) {",
  "if (shopSettings && shopSettings.opening_hours && shopSettings.opening_hours.loyalty_earn_rate) {"
);

code = code.replace(
  "setEarnRate(shopSettings.loyalty_earn_rate);",
  "setEarnRate(shopSettings.opening_hours.loyalty_earn_rate);"
);

// Also fix earnRule string translation
code = code.replace(
  "earnRule: '100 泰铢 = 1 积分'",
  "earnRule: `${earnRate} 泰铢 = 1 积分`"
);
code = code.replace(
  "earnRule: '100 THB = 1 Point'",
  "earnRule: `${earnRate} THB = 1 Point`"
);
code = code.replace(
  "earnRule: '100 บาท = 1 คะแนน'",
  "earnRule: `${earnRate} บาท = 1 คะแนน`"
);

fs.writeFileSync(path, code);
