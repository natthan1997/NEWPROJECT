const fs = require('fs');
const babel = require('@babel/core');
const code = fs.readFileSync('app/liff/member/page.tsx', 'utf8');

try {
  babel.parseSync(code, {
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
    filename: 'page.tsx'
  });
  console.log("No syntax errors found by Babel.");
} catch (e) {
  console.log(e.message);
}
