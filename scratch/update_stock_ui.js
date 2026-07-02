import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetUI = `           ) : viewMode === 'stock' ? (
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
               </div>`;

const replacementUI = `           ) : viewMode === 'stock' ? (
               <div className="relative h-full pb-20">
                 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                     {filteredItems.map(item => {
                         const currentStatus = stockDraft[item.id] !== undefined ? stockDraft[item.id] : (item.in_stock !== false);
                         return (
                         <div key={item.id} className={\`group bg-white border flex flex-col transition-all overflow-hidden rounded-2xl \${!currentStatus ? 'border-red-200 bg-red-50/30 opacity-80' : 'border-[#E5E5DF] hover:shadow-2xl hover:-translate-y-1'}\`}>
                             <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                                 {item.image_url ? <img src={item.image_url} className={\`w-full h-full object-cover transition-transform duration-700 \${!currentStatus ? 'grayscale' : 'group-hover:scale-105'}\`} /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="text-gray-200" /></div>}
                                 {!currentStatus && (
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
                                         onClick={() => handleStockDraftToggle(item.id, currentStatus)}
                                         className={\`w-full h-12 sm:h-14 flex items-center justify-center gap-2 rounded-xl transition-all font-black text-[11px] sm:text-[13px] tracking-widest uppercase active:scale-95 \${currentStatus ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 shadow-inner'}\`}
                                     >
                                         {currentStatus ? (
                                             <><CheckCircle2 size={18} /> มีของ (IN STOCK)</>
                                         ) : (
                                             <><XCircle size={18} /> หมด (SOLD OUT)</>
                                         )}
                                     </button>
                                 </div>
                             </div>
                         </div>
                     )})}
                 </div>
                 
                 <AnimatePresence>
                     {Object.keys(stockDraft).length > 0 && (
                         <motion.div 
                             initial={{ y: 100, opacity: 0 }}
                             animate={{ y: 0, opacity: 1 }}
                             exit={{ y: 100, opacity: 0 }}
                             className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100"
                         >
                             <div className="text-sm font-bold text-gray-600 whitespace-nowrap hidden sm:block">
                                 มีการเปลี่ยนแปลง <span className="text-amber-500 font-black">{Object.keys(stockDraft).length}</span> รายการ
                             </div>
                             <button
                                 onClick={() => setStockDraft({})}
                                 className="px-6 h-12 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                             >
                                 ยกเลิก
                             </button>
                             <button
                                 onClick={handleSaveStockDraft}
                                 disabled={isSaving}
                                 className="px-8 h-12 bg-black text-white font-black rounded-xl hover:bg-gray-800 hover:-translate-y-1 transition-all shadow-xl flex items-center gap-2"
                             >
                                 {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                 บันทึกการเปลี่ยนแปลง
                             </button>
                         </motion.div>
                     )}
                 </AnimatePresence>
               </div>`;

content = content.replace(targetUI, replacementUI);

fs.writeFileSync(filePath, content);
console.log("Updated UI for draft saving");
