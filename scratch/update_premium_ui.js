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
                  
                  // Premium typography logic
                  const isShortName = table.table_number.length <= 2;
                  const tableNumClass = isShortName 
                    ? 'text-4xl sm:text-5xl font-medium tracking-tight' 
                    : 'text-lg sm:text-xl font-bold tracking-tight leading-none break-words px-2';

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
                        className={\`w-full h-full relative flex flex-col items-center justify-center overflow-visible rounded-3xl transition-all duration-500 ease-out \${
                          isSelected 
                            ? 'bg-[#1A1A18] text-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] scale-105 z-10 ring-4 ring-[#1A1A18]/20 ring-offset-2' 
                            : isOccupied 
                              ? 'bg-white text-[#1A1A18] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)] hover:-translate-y-1' 
                              : 'bg-[#F9F9F9] text-gray-400 border border-transparent hover:bg-white hover:text-gray-700 hover:border-gray-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1'
                        }\`}
                      >
                        {/* Zone - Top Left */}
                        <span className={\`absolute top-4 left-4 text-[9px] font-bold uppercase tracking-widest \${isSelected ? 'text-white/60' : isOccupied ? 'text-gray-400' : 'text-gray-400'}\`}>
                          {table.zone || 'MAIN'}
                        </span>

                        {/* Occupied Pulse - Top Right */}
                        {isOccupied && !isSelected && (
                          <div className="absolute top-4 right-4 flex items-center justify-center w-2 h-2">
                            <div className="absolute w-full h-full rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                            <div className="relative w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          </div>
                        )}
                        
                        {/* Table Name - Center */}
                        <span className={\`\${tableNumClass} \${(table.parent_table_id || isParent) ? 'mb-2' : ''}\`}>
                          {table.table_number}
                        </span>

                        {/* Linked Table Floating Pill */}
                        {(table.parent_table_id || isParent) && (
                          <div className={\`absolute -bottom-3 inset-x-0 mx-auto w-max px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all \${
                            isSelected
                              ? 'bg-white text-black border border-white'
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
