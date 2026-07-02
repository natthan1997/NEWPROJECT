const fs = require('fs');
const file = 'components/pos/POSTerminal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update minReq / maxAllowed logic (around line 3149)
content = content.replace(
  /const selectedInGroup = tempSelectedModifiers\.filter\(m => m\.group_id === group\.id\)\s+const isComplete = selectedInGroup\.length >= minReq\s+const isAtMax = selectedInGroup\.length >= maxAllowed/,
  `const selectedInGroup = tempSelectedModifiers.filter(m => m.group_id === group.id)
                const totalQtyInGroup = selectedInGroup.reduce((sum, m) => sum + (m.qty || 1), 0)
                const isComplete = totalQtyInGroup >= minReq
                const isAtMax = totalQtyInGroup >= maxAllowed`
);

// 2. Update button rendering and click logic
const oldBtnRegex = /<button\s+key=\{opt\.id\}\s+disabled=\{!isSelected && isAtMax && maxAllowed > 1\}\s+onClick=\{[^}]+\}\s+className=\{`group relative flex h-28 flex-col justify-between rounded-2xl p-4 text-left transition-all outline-none \$\{[^}]+\}`\}\s+>\s*<div className="flex w-full items-start justify-between gap-2">\s*<div className=\{`text-sm font-black leading-tight \$\{[^}]+\}`\}>\s*\{opt\.name\}\s*<\/div>\s*<div className=\{`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full transition-all \$\{[^}]+\}`\}>\s*<Check size=\{14\} strokeWidth=\{3\} \/>\s*<\/div>\s*<\/div>/g;

// Wait, the regex might be too brittle. I'll use multi_replace_file_content or a robust script.
