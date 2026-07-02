import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `           ) : viewMode === 'grid' ? (`;

const replacement = `           ) : viewMode === 'stock' ? (
               <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                   {filteredItems.map(item => (
                       <div key={item.id} className={\`group bg-white border flex flex-col transition-all overflow-hidden rounded-2xl \${item.in_stock === false ? 'border-red-200 bg-red-50/30 opacity-80' : 'border-[#E5E5DF] hover:shadow-2xl hover:-translate-y-1'}\`}>
                           <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                               {item.image_url ? <img src={item.image_url} className={\`w-full h-full object-cover transition-transform duration-700 \${item.in_stock === false ? 'grayscale' : 'group-hover:scale-105'}\`} /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="text-gray-200" /></div>}
                               {item.in_stock === false && (
                                   <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center backdrop-blur-[2px]">
                                       <div className="bg-red-600 text-white px-5 py-2 font-black tracking-[0.2em] uppercase text-sm -rotate-12 shadow-2xl border-2 border-red-400/50">SOLD OUT</div>
                                   </div>
                               )}
                           </div>
                           <div className="p-4 sm:p-5 flex flex-col flex-1">
                               <div className="text-[9px] font-black uppercase tracking-widest text-sage-600 mb-1">{item.category?.name || 'GENERIC'}</div>
                               <h4 className="text-[13px] sm:text-[15px] font-black tracking-tight leading-tight line-clamp-2 min-h-10 text-black mb-4">{getPrimaryMenuName(item)}</h4>
                               
                               <div className="mt-auto">
                                   <button 
                                       onClick={() => handleBulkUpdate(item.id, 'in_stock', item.in_stock === false ? true : false)}
                                       className={\`w-full h-12 sm:h-14 flex items-center justify-center gap-2 rounded-xl transition-all font-black text-[11px] sm:text-[13px] tracking-widest uppercase active:scale-95 \${item.in_stock !== false ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 shadow-inner'}\`}
                                   >
                                       {item.in_stock !== false ? (
                                           <><CheckCircle2 size={18} /> มีของ (IN STOCK)</>
                                       ) : (
                                           <><XCircle size={18} /> หมด (SOLD OUT)</>
                                       )}
                                   </button>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           ) : viewMode === 'grid' ? (`;

content = content.replace(target, replacement);

fs.writeFileSync(filePath, content);
console.log("Updated stock view UI in POSMenuManager.tsx");
