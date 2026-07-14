const fs = require('fs');

function fixFile(file) {
    let code = fs.readFileSync(file, 'utf8');
    
    const target1 = `  } catch (error: any) {
    console.error('Printer Connection Error:', error)
    return error.message || JSON.stringify(error) || 'Unknown TCP error'
  }`;
    const replace1 = `  } catch (error: any) {
    console.error('Printer Connection Error:', error)
    throw new Error(error.message || JSON.stringify(error) || 'Unknown TCP error')
  }`;

    if (code.includes(target1)) {
        code = code.replace(target1, replace1);
    }
    
    // Make sure printCustomerReceipt doesn't swallow
    const target2 = `  } catch (error) {
    console.error('Print Receipt Error:', error)
    return false
  }`;
    const replace2 = `  } catch (error) {
    console.error('Print Receipt Error:', error)
    throw error
  }`;
    if (code.includes(target2)) code = code.replace(target2, replace2);

    // Make sure printKitchenTicket doesn't swallow
    const target3 = `  } catch (error) {
    console.error('Print Kitchen Error:', error)
    return false
  }`;
    const replace3 = `  } catch (error) {
    console.error('Print Kitchen Error:', error)
    throw error
  }`;
    if (code.includes(target3)) code = code.replace(target3, replace3);

    fs.writeFileSync(file, code, 'utf8');
}

fixFile('lib/printerUtils.ts');
console.log('Fixed printerUtils.ts to throw errors');
