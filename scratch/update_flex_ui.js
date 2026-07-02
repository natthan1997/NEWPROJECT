import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSTerminal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\{tables\.map\(table => \{([\s\S]*?)\}\)\}/;

const match = content.match(regex);
if (match) {
    const replacement = `{tables.map(table => {
                  const targetTable = table.parent_table_id ? tables.find(t => t.id === table.parent_table_id) || table : table;
                  const childrenTables = tables.filter(t => t.parent_table_id === table.id);
                  const isParent = childrenTables.length > 0;
                  
                  const pendingForThisTable = pendingOrders.filter(
                    o => o.table_id === targetTable.id && o.status === 'pending'
                  )
                  const isOccupied = pendingForThisTable.length > 0 || targetTable.status === 'occupied'
                  const isIdleOccupied = targetTable.status === 'occupied' && pendingForThisTable.length === 0
                  
                  const isSelected = selectedTable?.id === targetTable.id;
                  
                  // Text size logic
                  const isShortName = table.table_number.length <= 3;
                  const tableNumClass = isShortName 
                    ? 'text-3xl sm:text-4xl font-black tracking-tighter' 
                    : 'text-sm sm:text-base font-bold tracking-tight leading-tight break-words px-1';

                  return (
                    <div key={table.id} className="relative aspect-square flex flex-col group">
                      <button
                        onClick={() => {
                          if (selectedTable?.id === targetTable.id) {
                            resetOrderComposer()
                            setTotalPaid(0)
                            setShowTableModal(false)
                          } else {
                            if (pendingForThisTable.length > 0 && cart.length > 0 && !editingOrderId) {
                                setMergeTableTarget({ table: targetTable, pendingOrder: pendingForThisTable[0] })
                            } else {
                                if (editingOrderId) {
                                    if (isOccupied) {
                                        if (confirm(\`โต๊ะ \${targetTable.table_number} มีลูกค้าอยู่แล้ว ต้องการนำบิลของโต๊ะ \${selectedTable?.table_number || 'ปัจจุบัน'} ไปรวมบิลด้วยใช่หรือไม่?\`)) {
                                            setIsProcessing(true);
                                            (async () => {
                                                try {
                                                    const targetOrder = pendingForThisTable[0];
                                                    if (!targetOrder) throw new Error('ไม่พบออเดอร์ปลายทาง');
                                                    
                                                    const { data: currentItems } = await supabase.from('pos_order_items').select('*').eq('order_id', editingOrderId);
                                                    
                                                    if (currentItems && currentItems.length > 0) {
                                                        const updatedItems = currentItems.map(item => {
                                                            const mods = item.selected_modifiers || [];
                                                            mods.push({ name: \`[ย้ายมาจากโต๊ะ \${selectedTable?.table_number || 'เดิม'}]\`, price_adjustment: 0, qty: 1 });
                                                            return { ...item, order_id: targetOrder.id, selected_modifiers: mods };
                                                        });
                                                        await supabase.from('pos_order_items').upsert(updatedItems);
                                                    }
                                                    
                                                    await supabase.from('pos_orders').update({ status: 'cancelled' }).eq('id', editingOrderId);
                                                    
                                                    if (selectedTable?.id) {
                                                        await supabase.from('pos_tables').update({ parent_table_id: targetTable.id }).eq('id', selectedTable.id);
                                                    }
                                                    
                                                    alert('รวมโต๊ะสำเร็จ! รายการอาหารถูกย้ายไปรวมในบิลของโต๊ะ ' + targetTable.table_number + ' เรียบร้อยแล้ว');
                                                    
                                                    fetchTables();
                                                    refreshPendingOrders();
                                                    resetDeliveryDraft();
                                                    setShowTableModal(false);
                                                } catch (err: any) {
                                                    alert('Error merging tables: ' + err.message);
                                                } finally {
                                                    setIsProcessing(false);
                                                }
                                            })();
                                        }
                                        return;
                                    }
                                }

                                setSelectedTable(targetTable)
                                setOrderType('dine_in')
                                resetDeliveryDraft()
                                setShowTableModal(false)
                                if (pendingForThisTable.length > 0) {
                                    handleResumeOrder(pendingForThisTable[0])
                                }
                            }
                          }
                        }}
                        className={\`w-full h-full relative flex flex-col items-center justify-center overflow-visible rounded-3xl transition-all duration-300 ease-out border-2 \${
                          isSelected 
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20 scale-105 z-10' 
                            : isOccupied 
                              ? 'bg-[#1A1A18] text-white border-[#1A1A18] shadow-lg' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                        }\`}
                      >
                        <div className="flex flex-col h-full w-full p-3 sm:p-4">
                            {/* Top Row: Zone & Dot */}
                            <div className="flex justify-between items-start w-full">
                                <span className={\`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest \${isSelected ? 'text-white/80' : isOccupied ? 'text-gray-400' : 'text-gray-400'}\`}>
                                {table.zone || 'MAIN'}
                                </span>
                                {isOccupied && !isSelected && (
                                <div className="relative flex items-center justify-center w-2 h-2 mt-0.5">
                                    <div className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                                    <div className="relative w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                </div>
                                )}
                            </div>
                            
                            {/* Center: Table Name */}
                            <div className="flex-1 flex items-center justify-center w-full">
                                <span className={\`\${tableNumClass} text-center\`}>
                                {table.table_number}
                                </span>
                            </div>
                        </div>

                        {/* Linked Table Floating Pill */}
                        {(table.parent_table_id || isParent) && (
                          <div className={\`absolute -bottom-3 inset-x-0 mx-auto w-max px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all z-20 \${
                            isSelected
                              ? 'bg-white text-emerald-600 border border-emerald-100'
                              : isOccupied
                                ? 'bg-white text-[#1A1A18] border border-gray-200'
                                : 'bg-[#1A1A18] text-white border border-[#1A1A18]'
                          }\`}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              {table.parent_table_id 
                                ? \`โต๊ะ \${targetTable.table_number}\`
                                : \`+ โต๊ะ \${childrenTables.map(t => t.table_number).join(', ')}\`
                              }
                            </span>
                          </div>
                        )}
                      </button>
                      
                      {/* Idle Clear Button */}
                      {isIdleOccupied && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClearIdleTable(table)
                          }}
                          className="absolute -bottom-8 inset-x-0 mx-auto w-max z-20 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 shadow-sm transition-all hover:border-amber-400 hover:bg-amber-100 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                        >
                          เคลียร์โต๊ะ
                        </button>
                      )}
                    </div>
                  )
                })}`;
    
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log("Successfully replaced UI logic.");
} else {
    console.log("Could not find regex match.");
}
