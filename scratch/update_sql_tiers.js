import fs from 'fs';

const filePath = 'migrations/20260703150000_loyalty_program.sql';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/'Seed'/g, "'Bronze'");
content = content.replace(/'Sprout'/g, "'Silver'");
content = content.replace(/'Tree'/g, "'Gold'");
content = content.replace(/'Bloom'/g, "'Platinum'");

// update colors
content = content.replace(/'#86efac'/g, "'#b45309'");
content = content.replace(/'#4ade80'/g, "'#64748b'");
content = content.replace(/'#22c55e'/g, "'#ca8a04'");
content = content.replace(/'#16a34a'/g, "'#0369a1'");

fs.writeFileSync(filePath, content);
console.log('Updated SQL Migration file');
