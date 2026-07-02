import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/dashboard/delivery/DeliveryManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStart = content.indexOf('           ) : orders.map(order => {');
const targetEnd = content.indexOf('           })}\n        </div>\n      </div>');

if (targetStart === -1 || targetEnd === -1) {
  console.log('Could not find target block');
  process.exit(1);
}

const newRender = `           ) : orders.map(order => {
            const statusMeta = getStatusMeta(order.status)
            const itemCount = (order.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)
            const isExpanded = expandedOrderId === order.id
            const note = getDisplayComment(order.comment)
            const pickupTime = getPickupTime(order.comment)
            const isTakeaway = order.order_type === 'takeaway'
            const orderTypeLabel = isTakeaway ? 'TAKEAWAY' : 'DELIVERY'

             if (isDrawer) {
               const canAcceptOrder = order.status === 'paid' || order.status === 'pending' || order.status === 'accepted'
               
               let displayStatus = 'PENDING'
               let statusClass = 'bg-gray-100 text-gray-500'
               if (order.status === 'preparing') { displayStatus = 'PREPARING'; statusClass = 'bg-amber-100 text-amber-700' }
               else if (order.status === 'shipping') { displayStatus = 'SHIPPING'; statusClass = 'bg-blue-100 text-blue-700' }
               else if (order.status === 'completed') { displayStatus = 'COMPLETED'; statusClass = 'bg-emerald-100 text-emerald-700' }

               return (
                  <div
                    key={order.id}
                    className="shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100 transition-all duration-300 flex flex-col mb-4"
                  >
                   {/* Header (Clickable) */}
                   <div
                     className="w-full p-5 sm:p-6 text-left transition-colors cursor-pointer active:bg-gray-50"
                     onClick={() => setExpandedOrderId(current => current === order.id ? null : order.id)}
                   >
                     <div className="flex items-start justify-between gap-3">
                       <div className="min-w-0 flex-1">
                         <div className="flex flex-wrap items-center gap-2 mb-3">
                           <span className="text-[11px] font-black tracking-widest text-[#1A1A18] uppercase">
                             #{order.order_number}
                           </span>
                           <span className={\`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest \${isTakeaway ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}\`}>
                             {orderTypeLabel}
                           </span>
                           <span className={\`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest \${statusClass}\`}>
                             {displayStatus}
                           </span>
                         </div>
                         <h3 className="truncate text-[22px] font-black text-[#1A1A18] uppercase tracking-tight leading-tight mb-1">
                           {order.customer_name || 'GUEST'}
                         </h3>
                         {order.reference_name && (
                           <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                             <Phone size={14} />
                             <span className="text-[12px] font-bold">{order.reference_name}</span>
                           </div>
                         )}
                         <div className="mt-1 flex items-center gap-2">
                            <span className="text-[18px] font-black text-[#1A1A18]">฿{Number(order.net_total || order.total_amount || 0).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                               • {itemCount} ITEM{itemCount > 1 ? 'S' : ''}
                            </span>
                         </div>
                       </div>
                       <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-400">
                          <ChevronDown size={20} className={\`transition-transform duration-300 \${isExpanded ? 'rotate-180' : ''}\`} />
                       </div>
                     </div>
                   </div>

                    {/* EXPANDED CONTENT */}
                    <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="border-t border-gray-100 overflow-hidden"
                      >
                         <div className="p-5 sm:p-6 space-y-4 bg-[#F9F9FB]">
                            {/* Delivery Address / Pickup info */}
                            {isTakeaway ? (
                              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                 <div className="flex items-start gap-3">
                                   <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                     <Clock size={16} />
                                   </div>
                                   <div className="flex-1">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">PICKUP TIME</p>
                                     <p className="text-sm font-bold text-[#1A1A18]">
                                       {pickupTime || 'As soon as possible'}
                                     </p>
                                   </div>
                                 </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                 <div className="flex items-start gap-3">
                                   <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                     <MapPin size={16} />
                                   </div>
                                   <div className="flex-1">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">DELIVERY ADDRESS</p>
                                     <p className="text-sm font-bold text-[#1A1A18] leading-snug">
                                       {order.delivery_address || 'No address provided'}
                                     </p>
                                   </div>
                                 </div>
                              </div>
                            )}

                            {note && (
                              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">CUSTOMER NOTE</p>
                                <p className="text-[13px] font-bold text-[#1A1A18] leading-snug">{note}</p>
                              </div>
                            )}
                            
                            {/* Items */}
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                               <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                 <ShoppingBag size={14} /> ORDER ITEMS
                               </div>
                               <div className="space-y-3">
                                 {(order.items || []).map((item: any, idx: number) => (
                                   <div key={idx} className="flex gap-3">
                                     <span className="text-[13px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg h-fit">
                                       {item.quantity}x
                                     </span>
                                     <div className="min-w-0 flex-1">
                                       <p className="text-[13px] font-bold leading-tight text-[#1A1A18]">
                                         {item.item?.name || item.name || 'Unknown Item'}
                                       </p>
                                       {item.selected_modifiers?.length > 0 && (
                                         <div className="mt-1.5 flex flex-col gap-1">
                                           {item.selected_modifiers.map((modifier: any, modifierIdx: number) => {
                                             const modifierLabel = modifier?.is_note
                                               ? \`หมายเหตุ: \${modifier?.value || modifier?.name || ''}\`
                                               : modifier?.value && modifier.value !== modifier.name
                                                 ? \`\${modifier.name}: \${modifier.value}\`
                                                 : modifier?.name || ''
                                             if (!modifierLabel) return null
                                             return (
                                               <span key={modifierIdx} className="text-[11px] font-medium text-gray-500">
                                                 - {modifierLabel}
                                               </span>
                                             )
                                           })}
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                            </div>

                         </div>
                      </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Action Buttons Always Visible */}
                    <div className="p-4 sm:p-5 bg-white border-t border-gray-100">
                       {(order.status === 'paid' || order.status === 'pending' || order.status === 'accepted') ? (
                         <button
                           onClick={() => handleStatus(order.id, 'preparing')}
                           className="w-full h-14 rounded-2xl bg-[#1A1A18] text-[12px] font-black uppercase tracking-[0.1em] text-white transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 hover:bg-black"
                         >
                           <CheckCircle2 size={18} /> ACCEPT & PREPARE
                         </button>
                       ) : order.status === 'preparing' ? (
                         <button
                           onClick={() => handleStatus(order.id, 'shipping')}
                           className="w-full h-14 rounded-2xl bg-blue-600 text-[12px] font-black uppercase tracking-[0.1em] text-white transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 hover:bg-blue-700"
                         >
                           <Truck size={18} /> DISPATCH ORDER
                         </button>
                       ) : (
                         <div className="grid grid-cols-2 gap-3">
                           <button
                             onClick={() => openGoogleMaps(order)}
                             className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gray-50 text-gray-700 text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-[0.98] hover:bg-gray-100 border border-gray-200"
                           >
                             <Navigation size={16} /> MAPS
                           </button>
                           <button
                             onClick={() => setFinishModalOrder(order)}
                             className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-[0.98] shadow-md shadow-emerald-500/20 hover:bg-emerald-600"
                           >
                             <CheckCircle2 size={16} /> FINISH
                           </button>
                         </div>
                       )}
                    </div>
                </div>
               )
             }

             // --- DESKTOP / PAGE VIEW ---
             return (
             <div 
               key={order.id}
               className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md"
             >
                <div className="flex justify-between items-start mb-5">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        {orderTypeLabel}
                     </span>
                     <div className="bg-gray-100 text-gray-800 font-black rounded-xl uppercase px-3 py-1.5 text-[12px] w-fit">
                        #{order.order_number}
                     </div>
                   </div>
                   <div className={\`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest \${
                     order.status === 'shipping' ? 'bg-blue-50 text-blue-600' : 
                     order.status === 'preparing' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'
                   }\`}>
                      {order.status}
                   </div>
                </div>

                <div className="flex-1 mb-5">
                   <h2 className="text-[22px] font-black text-[#1A1A18] leading-tight mb-2 uppercase">{order.customer_name || 'Customer'}</h2>
                   {order.reference_name && (
                     <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                       <Phone size={14} />
                       <span className="text-[13px] font-bold">{order.reference_name}</span>
                     </div>
                   )}
                   <div className="flex items-start gap-2 text-gray-500 mb-4 bg-[#F5F5F7] p-3 rounded-2xl">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                      <div>
                        <p className="text-[13px] font-bold leading-snug">{order.delivery_address || 'No Address'}</p>
                        {getDisplayComment(order.comment) && (
                          <p className="mt-1.5 text-[11px] font-medium text-gray-500">
                            Note: {getDisplayComment(order.comment)}
                          </p>
                        )}
                        {getNavigationTarget(order) && (
                          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                            GPS READY
                          </p>
                        )}
                      </div>
                   </div>

                   {/* 📝 ORDER ITEMS */}
                   <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Items</div>
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                           <span className="text-[13px] font-black text-[#1A1A18]">{item.quantity}x</span>
                           <div className="flex-1">
                              <p className="text-[13px] font-bold text-[#1A1A18] leading-tight">
                                {item.item?.name || item.name || 'Unknown Item'}
                              </p>
                              {item.selected_modifiers?.length > 0 && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                  {item.selected_modifiers.map((m: any, mIdx: number) => (
                                    <span key={mIdx} className="text-[11px] font-medium text-gray-400 block">
                                       - {m.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* 🕹️ ACTIONS */}
                <div className="pt-4 border-t border-gray-100">
                   {order.status === 'paid' || order.status === 'pending' || order.status === 'accepted' ? (
                     <button 
                       onClick={() => handleStatus(order.id, 'preparing')}
                       className="w-full bg-[#1A1A18] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md h-14 text-[12px] hover:bg-black"
                     >
                        <CheckCircle2 size={18} /> ACCEPT & PREPARE
                     </button>
                   ) : order.status === 'preparing' ? (
                     <button 
                       onClick={() => handleStatus(order.id, 'shipping')}
                       className="w-full bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-blue-500/20 h-14 text-[12px] hover:bg-blue-700"
                     >
                        <Truck size={18} /> START SHIPPING
                     </button>
                   ) : (
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => openGoogleMaps(order)}
                          className="bg-gray-50 text-gray-700 border border-gray-200 rounded-2xl font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:bg-gray-100 h-14"
                        >
                           <Navigation size={16} />
                           <span className="text-[9px]">G-MAPS</span>
                        </button>
                        <button 
                          onClick={() => setFinishModalOrder(order)}
                          className="bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-emerald-500/20 hover:bg-emerald-600 h-14"
                        >
                           <CheckCircle2 size={16} />
                           <span className="text-[9px]">FINISH</span>
                        </button>
                     </div>
                   )}
                </div>
             </div>
             )
           })}`;

const newContent = content.substring(0, targetStart) + newRender + content.substring(targetEnd + 14);
fs.writeFileSync(filePath, newContent);
console.log('Successfully replaced delivery cards');
