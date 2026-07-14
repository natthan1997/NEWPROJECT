const fs = require('fs');
let code = fs.readFileSync('lib/printerUtils.ts', 'utf8');

// 1. Fix printCanvasViaEscPos
code = code.replace(/} catch \(error: any\) \{\n    console\.error\('Graphic Print Error:', error\);\n    return error\.message \|\| 'Unknown Graphic Error';\n  }/, "} catch (error: any) {\n    console.error('Graphic Print Error:', error);\n    throw error;\n  }");

// 2. Fix printCustomerReceipt
code = code.replace(/} catch \(error\) \{\n    console\.error\('Customer Receipt Print Error:', error\)\n    return false\n  }/, "} catch (error) {\n    console.error('Customer Receipt Print Error:', error);\n    throw error;\n  }");

// 3. Fix printZReport
code = code.replace(/} catch \(error\) \{\n    console\.error\('Z-Report Print Error:', error\)\n    return false\n  }/, "} catch (error) {\n    console.error('Z-Report Print Error:', error);\n    throw error;\n  }");

// 4. Fix printPreReceipt
code = code.replace(/} catch \(error\) \{\n    console\.error\('Pre-Receipt Print Error:', error\)\n    return false\n  }/, "} catch (error) {\n    console.error('Pre-Receipt Print Error:', error);\n    throw error;\n  }");

// 5. Fix printOpenDrawer
code = code.replace(/} catch \(error\) \{\n    console\.error\('Open Drawer Error:', error\)\n    return false\n  }/, "} catch (error) {\n    console.error('Open Drawer Error:', error);\n    throw error;\n  }");

fs.writeFileSync('lib/printerUtils.ts', code, 'utf8');
