const fs = require('fs');
const file = '/Users/chenchirawongpothisan/.gemini/antigravity-ide/brain/04f5fd2b-5073-408e-bd88-2d9b3c464b1b/task.md';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('- `[/]` 2. Implement Checklist on Checkout', '- `[x]` 2. Implement Checklist on Checkout');
content = content.replace('- `[ ]` Fetch `pos_shop_settings` in `components/dashboard/AttendanceCheckIn.tsx`.', '- `[x]` Fetch `pos_shop_settings` in `components/dashboard/AttendanceCheckIn.tsx`.');
content = content.replace('- `[ ]` Display checklist in the Confirm Check Out modal.', '- `[x]` Display checklist in the Confirm Check Out modal.');
content = content.replace('- `[ ]` Disable the confirm button until all items are checked.', '- `[x]` Disable the confirm button until all items are checked.');
content = content.replace('- `[ ]` 3. Verification', '- `[/]` 3. Verification');
fs.writeFileSync(file, content);
