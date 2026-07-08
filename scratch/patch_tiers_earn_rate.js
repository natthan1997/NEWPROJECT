const fs = require('fs');
const path = 'app/liff/member/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const [tiers] = useState([",
  "const tiers = React.useMemo(() => ["
);
code = code.replace(
  "อัตราสะสมคะแนน 100 บาท = 1 คะแนน",
  "อัตราสะสมคะแนน ${earnRate} บาท = 1 คะแนน"
);
code = code.replace(
  "], []);",
  "], [earnRate]);"
);

// Wait, the original code doesn't have `], []);`, it just has `]);`
code = code.replace(
  "    { name: 'Platinum', minPoints: 2000, bg: 'bg-[#E5E4E2]', text: 'text-[#696969]', barColor: 'bg-[#E5E4E2]', bgHex: '#E5E4E2', textHex: '#696969', benefits: ['ส่วนลดพิเศษ 10% ทุกการใช้จ่าย', 'ฟรีค่าจัดส่งทุกออเดอร์', 'สิทธิพิเศษในวันเกิด'] }\n  ]);",
  "    { name: 'Platinum', minPoints: 2000, bg: 'bg-[#E5E4E2]', text: 'text-[#696969]', barColor: 'bg-[#E5E4E2]', bgHex: '#E5E4E2', textHex: '#696969', benefits: ['ส่วนลดพิเศษ 10% ทุกการใช้จ่าย', 'ฟรีค่าจัดส่งทุกออเดอร์', 'สิทธิพิเศษในวันเกิด'] }\n  ], [earnRate]);"
);

// replace backticks
code = code.replace(
  "benefits: ['อัตราสะสมคะแนน ${earnRate} บาท = 1 คะแนน'",
  "benefits: [`อัตราสะสมคะแนน ${earnRate} บาท = 1 คะแนน`"
);

fs.writeFileSync(path, code);
