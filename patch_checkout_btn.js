const fs = require('fs');
const filePath = 'components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `                      if (orderType === 'delivery') {
                        setShowDeliveryCheckoutModal(true)
                        return
                      }
                      if (!selectedCustomer) {
                        setMemberCheckoutStep('lookup')`;

const replacement = `                      if (orderType === 'delivery') {
                        setShowDeliveryCheckoutModal(true)
                        return
                      }
                      if (typeof window !== 'undefined' && !navigator.onLine) {
                        setShowPaymentModal(true)
                        return
                      }
                      if (!selectedCustomer) {
                        setMemberCheckoutStep('lookup')`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched checkout button');
} else {
  console.log('Target string not found');
}
