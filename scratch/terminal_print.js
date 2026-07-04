import fs from 'fs';

const filePath = 'components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `                  orderNumber={paymentSuccessData.orderNumber}\n                  orderType={paymentSuccessData.orderType || orderType}`,
  `                  orderNumber={paymentSuccessData.orderNumber}\n                  queueNumber={paymentSuccessData.queueNumber}\n                  orderType={paymentSuccessData.orderType || orderType}`
);

fs.writeFileSync(filePath, content);
console.log('Fixed POSTerminal print');
