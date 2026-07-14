const fs = require('fs');

function fixFile(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // Make sure graphic mode doesn't swallow
    const target1 = `  } catch (error: any) {
    console.error('Graphic Print Error:', error);
    return false;
  }`;
    const replace1 = `  } catch (error: any) {
    console.error('Graphic Print Error:', error);
    throw error;
  }`;
    if (code.includes(target1)) code = code.replace(target1, replace1);

    const target2 = `  } catch (error: any) {
    console.error('Graphic Print Error:', error);
    return error.message || 'Unknown Graphic Error';
  }`;
    const replace2 = `  } catch (error: any) {
    console.error('Graphic Print Error:', error);
    throw error;
  }`;
    if (code.includes(target2)) code = code.replace(target2, replace2);

    fs.writeFileSync(file, code, 'utf8');
}

fixFile('lib/graphicPrinter.ts');
console.log('Fixed graphicPrinter.ts to throw errors');
