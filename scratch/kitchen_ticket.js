import fs from 'fs';

const filePath = 'components/pos/POSKitchenTicket.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `              <div className="text-6xl font-black leading-none break-words">{queueNumber || '-'}</div>`,
  `              <div className="text-6xl font-black leading-none break-words">{queueNumber ? \`#\${String(queueNumber).padStart(3, '0')}\` : '-'}</div>`
);

fs.writeFileSync(filePath, content);
console.log('Fixed Kitchen Ticket');
