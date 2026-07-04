const fs = require('fs');
const path = require('path');

// Fix POSTerminal.tsx
const termPath = path.join(__dirname, '../components/pos/POSTerminal.tsx');
let termCode = fs.readFileSync(termPath, 'utf8');

termCode = termCode.replace(/shopSettings\?\.loyalty_points_per_thb/g, "(shopSettings?.opening_hours?.loyalty_points_per_thb)");

fs.writeFileSync(termPath, termCode);

// Fix PointGenerator.tsx
const pgPath = path.join(__dirname, '../components/pos/PointGenerator.tsx');
let pgCode = fs.readFileSync(pgPath, 'utf8');

pgCode = pgCode.replace(/\.select\('loyalty_earn_rate'\)/, ".select('opening_hours')");
pgCode = pgCode.replace(/if \(data && data\.loyalty_earn_rate\) \{/, "if (data && data.opening_hours && data.opening_hours.loyalty_earn_rate) {");
pgCode = pgCode.replace(/setEarnRate\(data\.loyalty_earn_rate\);/, "setEarnRate(data.opening_hours.loyalty_earn_rate);");

fs.writeFileSync(pgPath, pgCode);
