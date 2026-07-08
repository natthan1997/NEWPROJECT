const fs = require('fs');
const target = 'app/database-migration/page.tsx';
let c = fs.readFileSync(target, 'utf8');

const searchSql = `ALTER TABLE pos_loyalty_titles ADD COLUMN IF NOT EXISTS description TEXT;`;
const replaceSql = `ALTER TABLE pos_loyalty_titles ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE pos_loyalty_titles ADD COLUMN IF NOT EXISTS benefits TEXT;`;

c = c.replace(searchSql, replaceSql);
fs.writeFileSync(target, c);
console.log('Migration updated');
