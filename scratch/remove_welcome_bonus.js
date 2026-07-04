import fs from 'fs';

const filePath = 'app/api/liff/member/init/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace points: 200 with points: 0
content = content.replace(/points: 200,/g, 'points: 0,');
content = content.replace(/total_accumulated_points: 200,/g, 'total_accumulated_points: 0,');

// Remove the welcome bonus history record insert
const historyRegex = /\/\/ Record in history for welcome bonus[\s\S]*?\}\)\.catch\(\(\) => \{\}\)/;
content = content.replace(historyRegex, '');

fs.writeFileSync(filePath, content);
console.log('Removed Welcome Bonus from init route.');
