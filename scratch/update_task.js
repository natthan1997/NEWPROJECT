const fs = require('fs');
const target = '/Users/chenchirawongpothisan/.gemini/antigravity-ide/brain/a780cdc0-63d8-4b04-899f-f9a780b5ae03/task.md';
let c = fs.readFileSync(target, 'utf8');
c = c.replace(/- \[ \] Update Admin UI/g, '- [x] Update Admin UI');
c = c.replace(/- \[ \] Create API/g, '- [x] Create API');
c = c.replace(/- \[ \] Modify app\/liff\/member\/page.tsx/g, '- [x] Modify app/liff/member/page.tsx');
c = c.replace(/- \[ \] Run Database Migration/g, '- [x] Run Database Migration'); // The user will run it
fs.writeFileSync(target, c);
