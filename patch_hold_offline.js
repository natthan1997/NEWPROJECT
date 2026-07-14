const fs = require('fs');
const filePath = 'components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `    if (!ensureDeliveryDetailsReady()) return

    if (orderType === 'dine_in' && !selectedTable) {`;

const replacement = `    if (!ensureDeliveryDetailsReady()) return

    if (typeof window !== 'undefined' && !navigator.onLine) {
      alert('ไม่สามารถพักบิลในโหมด Offline ได้ กรุณาชำระเงินทันที');
      return;
    }

    if (orderType === 'dine_in' && !selectedTable) {`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched handleHoldOrder offline');
} else {
  console.log('Target string not found');
}
