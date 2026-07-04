import fs from 'fs';

const filePath = 'app/liff/member/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The line is broken:
// className="flex gap-3 overflow-x-auto pb-4 snap-x style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} [&::-webkit-scrollbar]:hidden -mx-5 px-5"
// It should be:
// className="flex gap-3 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden -mx-5 px-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}

content = content.replace(/className="([^"]*)style=\{\{\s*scrollbarWidth:\s*"none",\s*msOverflowStyle:\s*"none"\s*\}\}\s*([^"]*)"/g, 'className="$1 $2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}');

fs.writeFileSync(filePath, content);
console.log('Fixed JSX in page.tsx');
