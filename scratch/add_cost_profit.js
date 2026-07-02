import fs from 'fs';

const filePath = 'components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// I will find the exact string where the price is rendered and replace it with price + cost + profit
const targetStr = `                               <div className="flex items-end justify-between mt-4">
                                    <div className="text-[16px] font-black text-gray-900">
                                        <span className="text-[11px] text-gray-500 mr-1">฿</span>
                                        {item.sale_price.toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); fetchItemLinks(item.id); setIsEditorOpen(true); }} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-black hover:text-white transition-all"><Edit3 size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                                    </div>
                               </div>`;

const newStr = `                               <div className="flex flex-col gap-3 mt-4">
                                   <div className="flex items-end justify-between">
                                        <div className="text-[16px] font-black text-gray-900">
                                            <span className="text-[11px] text-gray-500 mr-1">฿</span>
                                            {item.sale_price.toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); fetchItemLinks(item.id); setIsEditorOpen(true); }} className="w-7 h-7 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-black hover:text-white transition-all"><Edit3 size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                                        </div>
                                   </div>
                                   <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                       <div className="flex flex-col">
                                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ต้นทุน</span>
                                           <span className="text-[11px] font-bold text-gray-700">฿ {item.cost_price || 0}</span>
                                       </div>
                                       <div className="flex flex-col items-end">
                                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">กำไร</span>
                                           <span className={\`text-[11px] font-black \${item.sale_price > 0 && ((item.sale_price - (item.cost_price || 0)) / item.sale_price) > 0.5 ? 'text-emerald-500' : 'text-gray-500'}\`}>
                                               {item.sale_price > 0 ? Math.round(((item.sale_price - (item.cost_price || 0)) / item.sale_price) * 100) : 0}%
                                           </span>
                                       </div>
                                   </div>
                               </div>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync(filePath, content);
    console.log('Cost and profit added');
} else {
    console.log('Target string not found');
}
