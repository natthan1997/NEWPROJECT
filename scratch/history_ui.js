import fs from 'fs';

const filePath = 'components/pos/POSHistory.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `                    <div className="text-xs font-black uppercase tracking-widest text-[#1A1A18]">
                      {order.order_number}
                    </div>
                    {order.order_type === 'dine_in' && order.table_number && (`;

const replacement = `                    <div className="text-xs font-black uppercase tracking-widest text-[#1A1A18]">
                      {order.order_number}
                    </div>
                    {order.queue_number && (
                      <span className="bg-gray-100 px-1.5 py-0.5 text-[10px] font-black tracking-widest text-gray-700">
                        คิว A{String(order.queue_number).padStart(3, '0')}
                      </span>
                    )}
                    {order.order_type === 'dine_in' && order.table_number && (`;

content = content.replace(target, replacement);

fs.writeFileSync(filePath, content);
console.log('Fixed POSHistory UI');
