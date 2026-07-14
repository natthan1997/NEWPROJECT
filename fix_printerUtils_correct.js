const fs = require('fs');
let code = fs.readFileSync('lib/printerUtils.ts', 'utf8');

// Replace return false in ANY try-catch block for these print functions!
code = code.replace(/console\.error\('Kitchen Ticket Print Error:', error\)\n    return false/g, "console.error('Kitchen Ticket Print Error:', error)\n    throw error");
code = code.replace(/console\.error\('Z-Report Error:', error\)\n    return false/g, "console.error('Z-Report Error:', error)\n    throw error");

// Ensure sendToPrinter always throws string error if any
const target1 = `  } catch (error: any) {
    console.error('Printer Connection Error:', error)
    return error.message || JSON.stringify(error) || 'Unknown TCP error'
  }`;
const replace1 = `  } catch (error: any) {
    console.error('Printer Connection Error:', error)
    throw new Error(error.message || JSON.stringify(error) || 'Unknown TCP error')
  }`;
code = code.replace(target1, replace1);

// Wait, let's just make ALL sendToPrinter throw if it catches an error.
// The previous script already replaced target1. Let's make sure it's there.
if (!code.includes("throw new Error(error.message")) {
    console.log("sendToPrinter is not throwing!");
}

fs.writeFileSync('lib/printerUtils.ts', code, 'utf8');
