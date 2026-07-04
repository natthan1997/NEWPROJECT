import fs from 'fs';

const filePath = 'components/pos/POSHistory.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `  const buildPrintOrder = (order: any) => ({
    orderNumber: order.order_number,
    date: new Date(order.created_at).toLocaleString('th-TH'),`,
  `  const buildPrintOrder = (order: any) => ({
    orderNumber: order.order_number,
    queueNumber: order.queue_number,
    date: new Date(order.created_at).toLocaleString('th-TH'),`
);

fs.writeFileSync(filePath, content);
console.log('Fixed POSHistory print');
