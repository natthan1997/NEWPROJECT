import fs from 'fs';

const filePath = 'components/pos/POSMenuManager.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const startIndex = 753; // <div className="space-y-12">
const endIndex = 1022; // });}

const replacement = `                <div className="space-y-8 pb-20">
                    {categorySections.map(cat => {
                        const itemsInCat = filteredItems.filter(item => 
                            cat.id === 'uncategorized' 
                            ? !item.category_id || !categories.find(c => c.id === item.category_id)
                            : item.category_id === cat.id
                        );
                        
                        if (itemsInCat.length === 0) return null;

                        const activePlatforms = shopSettings?.opening_hours?.active_delivery_platforms || ['grab', 'lineman', 'shopee', 'foodpanda', 'robinhood'];

                        return (
                            <div key={cat.id} className="bg-white border border-gray-100/80 rounded-3xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 rounded-full bg-[#1A1A18]"></div>
                                        <h3 className="text-[16px] sm:text-[18px] font-black text-gray-900 tracking-tight">{cat.name}</h3>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500 bg-white shadow-sm px-3 py-1 rounded-full">{itemsInCat.length} Items</span>
                                </div>
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left min-w-[900px] border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-16 text-center">รูป</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 min-w-[200px]">รายละเอียดเมนู</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-32 text-center bg-gray-50/30">ต้นทุน (฿)</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-32 text-center bg-gray-50/50">ราคาขาย (฿)</th>
                                                
                                                {activePlatforms.includes('grab') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#00B14F] w-28 text-center bg-[#00B14F]/5">Grab</th>}
                                                {activePlatforms.includes('lineman') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#00B900] w-28 text-center bg-[#00B900]/5">Lineman</th>}
                                                {activePlatforms.includes('shopee') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#EE4D2D] w-28 text-center bg-[#EE4D2D]/5">Shopee</th>}
                                                {activePlatforms.includes('foodpanda') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#D70F64] w-28 text-center bg-[#D70F64]/5">Foodpanda</th>}
                                                {activePlatforms.includes('robinhood') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6023A2] w-28 text-center bg-[#6023A2]/5">Robinhood</th>}
                                                
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-32 text-center">สถานะ</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-16 text-center">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {itemsInCat.map((item, idx) => (
                                                <tr key={item.id} className="group hover:bg-gray-50/40 transition-colors align-middle">
                                                    {/* Image Column */}
                                                    <td className="p-4 text-center">
                                                        <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden mx-auto shadow-sm group-hover:shadow transition-all">
                                                            {item.image_url ? (
                                                                <img src={item.image_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={14} /></div>
                                                            )}
                                                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleInlineImageUpload(item.id, e.target.files?.[0])} />
                                                                <span className="text-[9px] font-black text-white uppercase tracking-widest">เปลี่ยน</span>
                                                            </label>
                                                        </div>
                                                    </td>

                                                    {/* Details Column */}
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <input 
                                                                type="text" 
                                                                defaultValue={item.name} 
                                                                onBlur={(e) => handleBulkUpdate(item.id, 'name', e.target.value)}
                                                                className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md px-2 py-1 -ml-2 text-[14px] font-black text-gray-900 transition-all"
                                                            />
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    defaultValue={item.name_en || ''}
                                                                    onBlur={(e) => handleBulkUpdate(item.id, 'name_en', e.target.value)}
                                                                    placeholder="EN Name"
                                                                    className="w-1/2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md px-2 py-1 -ml-2 text-[11px] font-bold text-gray-400 transition-all placeholder:text-gray-300"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    defaultValue={item.name_zh || ''}
                                                                    onBlur={(e) => handleBulkUpdate(item.id, 'name_zh', e.target.value)}
                                                                    placeholder="ZH Name"
                                                                    className="w-1/2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md px-2 py-1 text-[11px] font-bold text-gray-400 transition-all placeholder:text-gray-300"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Cost Column */}
                                                    <td className="p-4 bg-gray-50/30">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            defaultValue={item.cost_price ? Number(item.cost_price).toFixed(2) : ''}
                                                            onBlur={(e) => handleBulkUpdate(item.id, 'cost_price', Number(e.target.value))}
                                                            placeholder="0.00"
                                                            className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md py-1.5 text-[14px] font-black text-gray-500 text-center transition-all"
                                                        />
                                                        {item.sale_price > 0 && (
                                                            <div className="text-[9px] font-bold text-center mt-1 text-gray-400">
                                                                กำไร: <span className={((item.sale_price - (item.cost_price || 0)) / item.sale_price) > 0.5 ? 'text-emerald-500' : 'text-gray-500'}>
                                                                    {Math.round(((item.sale_price - (item.cost_price || 0)) / item.sale_price) * 100)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Sale Price Column */}
                                                    <td className="p-4 bg-gray-50/50">
                                                        <input 
                                                            type="number" 
                                                            defaultValue={item.sale_price} 
                                                            onBlur={(e) => handleBulkUpdate(item.id, 'sale_price', Number(e.target.value))}
                                                            className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md py-1.5 text-[15px] font-black text-gray-900 text-center transition-all"
                                                        />
                                                    </td>
                                                    
                                                    {/* Platform Prices */}
                                                    {activePlatforms.includes('grab') && (
                                                        <td className="p-4 bg-[#00B14F]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.grab || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), grab: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#00B14F]/20 rounded-md py-1.5 text-[14px] font-black text-[#00B14F] text-center placeholder:text-[#00B14F]/30 transition-all" />
                                                        </td>
                                                    )}
                                                    {activePlatforms.includes('lineman') && (
                                                        <td className="p-4 bg-[#00B900]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.lineman || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), lineman: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#00B900]/20 rounded-md py-1.5 text-[14px] font-black text-[#00B900] text-center placeholder:text-[#00B900]/30 transition-all" />
                                                        </td>
                                                    )}
                                                    {activePlatforms.includes('shopee') && (
                                                        <td className="p-4 bg-[#EE4D2D]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.shopee || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), shopee: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#EE4D2D]/20 rounded-md py-1.5 text-[14px] font-black text-[#EE4D2D] text-center placeholder:text-[#EE4D2D]/30 transition-all" />
                                                        </td>
                                                    )}
                                                    {activePlatforms.includes('foodpanda') && (
                                                        <td className="p-4 bg-[#D70F64]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.foodpanda || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), foodpanda: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#D70F64]/20 rounded-md py-1.5 text-[14px] font-black text-[#D70F64] text-center placeholder:text-[#D70F64]/30 transition-all" />
                                                        </td>
                                                    )}
                                                    {activePlatforms.includes('robinhood') && (
                                                        <td className="p-4 bg-[#6023A2]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.robinhood || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), robinhood: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#6023A2]/20 rounded-md py-1.5 text-[14px] font-black text-[#6023A2] text-center placeholder:text-[#6023A2]/30 transition-all" />
                                                        </td>
                                                    )}

                                                    {/* Status Column */}
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-2 items-center">
                                                            <button
                                                                onClick={() => handleBulkUpdate(item.id, 'status', item.status === 'active' ? 'inactive' : 'active')}
                                                                className={\`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none \${item.status === 'active' ? 'bg-[#1A1A18]' : 'bg-gray-200'}\`}
                                                            >
                                                                <span className={\`inline-block h-3 w-3 transform rounded-full bg-white transition-transform \${item.status === 'active' ? 'translate-x-5' : 'translate-x-1'}\`} />
                                                            </button>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleBulkUpdate(item.id, 'is_recommended', !item.is_recommended)}
                                                                    className={\`w-6 h-6 rounded-full flex items-center justify-center transition-all \${item.is_recommended ? 'bg-amber-100 text-amber-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}\`}
                                                                    title="Recommend"
                                                                >
                                                                    <Star size={11} className={item.is_recommended ? "fill-amber-500" : ""} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleBulkUpdate(item.id, 'out_of_stock', !item.out_of_stock)}
                                                                    className={\`w-6 h-6 rounded-full flex items-center justify-center transition-all \${item.out_of_stock ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}\`}
                                                                    title="Out of Stock"
                                                                >
                                                                    <AlertCircle size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Actions Column */}
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => handleDeleteItem(item.id)} 
                                                            className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
`;

const newContent = [...lines.slice(0, startIndex), replacement, ...lines.slice(endIndex + 1)].join('\n');
fs.writeFileSync(filePath, newContent);
console.log('POSMenuManager table view completely rewritten');
