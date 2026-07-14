const fs = require('fs');
const file = '/Users/chenchirawongpothisan/.gemini/antigravity-ide/brain/04f5fd2b-5073-408e-bd88-2d9b3c464b1b/task.md';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('- `[/]` 4. Verification', '- `[x]` 4. Verification');
content = content.replace('- `[ ]` Build and deploy to Vercel.', '- `[x]` Build and deploy to Vercel.');
fs.writeFileSync(file, content);
