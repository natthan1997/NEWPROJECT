const fs = require('fs');
let code = fs.readFileSync('lib/graphicPrinter.ts', 'utf8');

// Replace return false with throw error in catch blocks
code = code.replace(/} catch \(error\) \{\n    console\.error\(error\);\n    return false;\n  }/g, "} catch (error) {\n    console.error(error);\n    throw error;\n  }");

fs.writeFileSync('lib/graphicPrinter.ts', code, 'utf8');
