const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log("ENV Keys:");
  envContent.split('\n').forEach(line => {
    const key = line.split('=')[0]?.trim();
    if (key && !key.startsWith('#')) console.log(" -", key);
  });
}
console.log("pg exists in node_modules:", fs.existsSync(path.join(process.cwd(), 'node_modules', 'pg')));
