const fs = require('fs');
console.log(fs.readFileSync('lib/printerUtils.ts', 'utf8').substring(0, 1500));
