const fs = require('fs');
let code = fs.readFileSync('components/pos/POSTerminal.tsx', 'utf8');

const target = `                    }
                }
            } catch (err) {
                console.error('Background print error:', err);
            }
        })();`;

const replace = `                    }
                }
            } catch (err) {
                console.error('Background print error:', err);
                alert('เกิดข้อผิดพลาดในการสั่งปริ้นเข้าครัว (Kitchen Printer): ' + (err.message || err));
            }
        })();`;

if (code.includes(target)) {
    code = code.replace(target, replace);
    fs.writeFileSync('components/pos/POSTerminal.tsx', code, 'utf8');
    console.log('Fixed handleSendOrder printer error swallowing');
} else {
    console.log('Could not find target string in POSTerminal.tsx');
}
