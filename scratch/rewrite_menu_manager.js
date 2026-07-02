import fs from 'fs';

const filePath = 'components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace grid view
const gridStart = content.indexOf('<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-8 font-bold">');
const reorderStart = content.indexOf('           ) : reorderMode ? (');

if (gridStart !== -1 && reorderStart !== -1) {
    const newGrid = `
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 pb-20">
                   {/* Add Menu Ghost Card */}
                   <button
                       onClick={() => { setEditingItem({ name: '', name_en: '', name_zh: '', sale_price: 0, status: 'active', category_id: categories[0]?.id }); setIsEditorOpen(true); }}
                       className="group relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-3xl min-h-[220px] transition-all hover:bg-white hover:border-black hover:shadow-lg"
                   >
                       <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm text-gray-400 group-hover:bg-[#1A1A18] group-hover:text-white group-hover:border-black transition-all duration-300">
                           <Plus size={20} />
                       </div>
                       <span className="mt-4 text-[13px] font-black tracking-widest text-gray-400 group-hover:text-black uppercase">
                           {locale === 'en' ? 'Add Menu' : 'เพิ่มเมนูใหม่'}
                       </span>
                   </button>
                   
                   {filteredItems.map(item => (
                       <div key={item.id} className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => { setEditingItem(item); fetchItemLinks(item.id); setIsEditorOpen(true); }}>
                           <div className="aspect-square relative overflow-hidden bg-gray-50">
                               {item.image_url ? (
                                   <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                               ) : (
                                   <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50/50 group-hover:bg-gray-100 transition-colors">
                                       <ImageIcon size={32} />
                                   </div>
                               )}
                               <div className="absolute top-3 left-3 flex flex-col gap-1">
                                   {item.is_recommended && (
                                       <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest shadow-md uppercase">Recommend</span>
                                   )}
                                   {item.out_of_stock && (
                                       <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest shadow-md uppercase">Out of Stock</span>
                                   )}
                               </div>
                               <div className="absolute top-3 right-3 flex gap-1">
                                    <div className="flex bg-white/90 backdrop-blur-sm rounded-full shadow-sm p-1">
                                        <div className={\`w-6 h-6 rounded-full flex items-center justify-center transition-colors \${item.allow_takeaway ? 'text-[#1A1A18]' : 'text-gray-300'}\`} title="Takeaway">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                        </div>
                                        <div className={\`w-6 h-6 rounded-full flex items-center justify-center transition-colors \${item.allow_delivery ? 'text-[#1A1A18]' : 'text-gray-300'}\`} title="Delivery">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8n-11 4h-3m-13 5v2m0 0v2m0-2h2m-2 0H3m2 0V5a2 2 0 012-2h2a2 2 0 012 2v2" /></svg>
                                        </div>
                                    </div>
                               </div>
                           </div>
                           <div className="p-4 sm:p-5 flex flex-col flex-1">
                               <div className="flex-1">
                                   <div className="text-[14px] font-black text-gray-900 leading-tight line-clamp-2">{getPrimaryMenuName(item)}</div>
                                   {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
                                       <div className="text-[11px] font-bold text-gray-400 mt-1 line-clamp-1">{getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}</div>
                                   )}
                               </div>
                               <div className="flex items-end justify-between mt-4">
                                    <div className="text-[16px] font-black text-gray-900">
                                        <span className="text-[11px] text-gray-500 mr-1">฿</span>
                                        {item.sale_price.toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); fetchItemLinks(item.id); setIsEditorOpen(true); }} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-black hover:text-white transition-all"><Edit3 size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                                    </div>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
`;
    content = content.substring(0, gridStart) + newGrid + content.substring(reorderStart);
    fs.writeFileSync(filePath, content);
    console.log('POSMenuManager grid updated');
} else {
    console.log('Could not find the target string in POSMenuManager.tsx');
    console.log('gridStart:', gridStart, 'reorderStart:', reorderStart);
}
