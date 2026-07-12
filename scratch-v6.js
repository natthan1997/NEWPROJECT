const fs = require('fs');

const original = fs.readFileSync('app/liff/member/page.tsx', 'utf8');

const newContent = original.replace(
  "const [titles, setTitles] = useState<any[]>([]);",
  "const [titles, setTitles] = useState<any[]>([]);\n  const [activeTitle, setActiveTitle] = useState<any>(null);"
);

fs.writeFileSync('app/liff/member/page.tsx', newContent, 'utf8');
