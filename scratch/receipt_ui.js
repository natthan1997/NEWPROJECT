import fs from 'fs';

const filePath = 'components/pos/POSReceipt.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `export interface ReceiptProps {\n  orderNumber: string\n  orderType: string`,
  `export interface ReceiptProps {\n  orderNumber: string\n  queueNumber?: string\n  orderType: string`
);

content = content.replace(
  `export const POSReceipt = forwardRef<HTMLDivElement, ReceiptProps>(({`,
  `export const POSReceipt = forwardRef<HTMLDivElement, ReceiptProps>(({`
);

content = content.replace(
  `  orderNumber,\n  orderType,`,
  `  orderNumber,\n  queueNumber,\n  orderType,`
);

content = content.replace(
  `        <p className="text-[17px] leading-tight font-bold">{locale === 'en' ? 'ใบเสร็จรับเงิน / Receipt' : locale === 'zh' ? 'ใบเสร็จรับเงิน / Receipt' : 'ใบเสร็จรับเงิน / Receipt'}</p>\n      </div>`,
  `        <p className="text-[17px] leading-tight font-bold">{locale === 'en' ? 'ใบเสร็จรับเงิน / Receipt' : locale === 'zh' ? 'ใบเสร็จรับเงิน / Receipt' : 'ใบเสร็จรับเงิน / Receipt'}</p>\n        {queueNumber && (\n          <div className="mt-4 border-t-2 border-b-2 border-black border-dashed py-2">\n            <div className="text-[14px] font-bold">คิวที่ / QUEUE</div>\n            <div className="text-[48px] font-extrabold leading-none">A{String(queueNumber).padStart(3, '0')}</div>\n          </div>\n        )}\n      </div>`
);

fs.writeFileSync(filePath, content);
console.log('Fixed POSReceipt UI');
