const fs = require('fs');
let code = fs.readFileSync('lib/printerUtils.ts', 'utf8');
code = code.replace(/} catch \(error\) \{\n    console\.error\('Drawer Error:', error\)\n    return false\n  }/, "} catch (error) {\n    console.error('Drawer Error:', error);\n    throw error;\n  }");
fs.writeFileSync('lib/printerUtils.ts', code, 'utf8');
