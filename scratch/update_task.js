const fs = require('fs');
const path = require('path');

const filePath = path.join('/Users/chenchirawongpothisan/.gemini/antigravity-ide/brain/a780cdc0-63d8-4b04-899f-f9a780b5ae03/task.md');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(/- \[ \] Create API Route/g, '- [x] Create API Route');
code = code.replace(/- \[ \] Implement point deduction logic/g, '- [x] Implement point deduction logic');
code = code.replace(/- \[ \] Implement random reward logic/g, '- [x] Implement random reward logic');
code = code.replace(/- \[ \] Implement `pos_points_history` recording/g, '- [x] Implement `pos_points_history` recording');
code = code.replace(/- \[ \] Update `pos_members` points/g, '- [x] Update `pos_members` points');
code = code.replace(/- \[ \] Update `app\/liff\/member\/page\.tsx` UI/g, '- [x] Update `app/liff/member/page.tsx` UI');
code = code.replace(/- \[ \] Make the "ลุ้นกล่องสุ่มทุก 50 Pts" banner clickable/g, '- [x] Make the "ลุ้นกล่องสุ่มทุก 50 Pts" banner clickable');
code = code.replace(/- \[ \] Build a Mystery Box UI modal/g, '- [x] Build a Mystery Box UI modal');
code = code.replace(/- \[ \] Call the API and show results/g, '- [x] Call the API and show results');
code = code.replace(/- \[ \] Refresh member points/g, '- [x] Refresh member points');

fs.writeFileSync(filePath, code);
console.log('Task updated');
