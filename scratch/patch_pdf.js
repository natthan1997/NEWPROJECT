const fs = require('fs');
const path = 'lib/documentPdf.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("stage.style.position = 'fixed';", "stage.style.position = 'absolute';");
code = code.replace("stage.style.left = '0';", "stage.style.left = '-9999px';");
code = code.replace("stage.style.zIndex = '-1';", "stage.style.zIndex = '9999';");

fs.writeFileSync(path, code);
