import fs from 'fs';

const filePath = 'components/pos/POSReports.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    `const d = new Date(o.created_at); const k = timeRange === 'today'`,
    `const d = new Date(o.updated_at || o.created_at); const k = timeRange === 'today'`
);

// We should also replace other occurrences of Date(o.created_at) with Date(o.updated_at || o.created_at)
content = content.replace(
    /new Date\(o\.created_at\)/g,
    `new Date(o.updated_at || o.created_at)`
);

fs.writeFileSync(filePath, content);
console.log('updated POSReports trend');
