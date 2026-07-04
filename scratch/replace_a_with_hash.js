import fs from 'fs';

const files = [
  'components/pos/POSReceipt.tsx',
  'components/pos/POSHistory.tsx'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/A\{String\(queueNumber\)/g, '#{String(queueNumber)');
  content = content.replace(/คิว A\{String\(order.queue_number\)/g, 'คิว #{String(order.queue_number)');
  fs.writeFileSync(filePath, content);
});

console.log('Replaced A with #');
