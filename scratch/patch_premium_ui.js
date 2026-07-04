const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/POSTerminal.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const uiTarget = `               {memberCheckoutStep === 'lookup' ? (
                 <div className="p-8">
                   <h2 className="text-2xl font-black mb-2 text-center text-[#1A1A18] uppercase">
                     {locale === 'en' ? 'Member Check' : 'ตรวจสอบสมาชิก'}
                   </h2>
                   <p className="text-gray-500 text-center mb-6 text-sm font-bold">
                     {locale === 'en' ? 'Enter phone number to check points' : 'ใส่เบอร์โทรศัพท์เพื่อตรวจสอบแต้มและรับสิทธิพิเศษ'}
                   </p>
                   
                   <div className="relative mb-4">
                     <input
                        type="text"
                        autoFocus
                        placeholder={locale === 'en' ? 'Phone Number or Name...' : 'เบอร์โทรศัพท์ หรือ ชื่อ...'}
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' && memberSearchResults.length > 0) {
                              setSelectedCustomer(memberSearchResults[0]);
                              setMemberCheckoutStep('points');
                           } else if (e.key === 'Enter') {
                              handleSearchMemberFlow();
                           }
                        }}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-6 text-xl font-bold focus:outline-none focus:border-black transition-all"
                     />
                     {memberSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 max-h-[250px] overflow-y-auto">
                           {memberSearchResults.map((m) => (
                              <button
                                 key={m.id}
                                 onClick={() => {
                                    setSelectedCustomer(m);
                                    setMemberCheckoutStep('points');
                                    setMemberSearchResults([]);
                                 }}
                                 className="w-full text-left px-6 py-4 border-b border-gray-50 hover:bg-gray-50 flex items-center justify-between transition-colors last:border-b-0"
                              >
                                 <div>
                                    <div className="font-bold text-gray-800">{m.full_name || m.display_name || 'No Name'}</div>
                                    <div className="text-sm text-gray-400 mt-1 font-mono">{m.phone}</div>
                                 </div>
                                 <div className="text-emerald-500 font-black flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full text-xs">
                                    {m.points || 0} PTS
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                   </div>
                   
                   <div className="flex gap-3">
                     <button
                       onClick={() => {
                         setShowMemberCheckoutFlow(false);
                         setShowPaymentModal(true);
                       }}
                       className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all uppercase tracking-widest text-sm"
                     >
                       {locale === 'en' ? 'Skip' : 'ข้าม (ไม่เป็นสมาชิก)'}
                     </button>
                     <button
                       onClick={handleSearchMemberFlow}
                       disabled={!memberSearchQuery.trim() || isSearchingMember}
                       className="flex-1 py-4 bg-[#1A1A18] hover:bg-black text-white font-black rounded-2xl transition-all uppercase tracking-widest text-sm flex items-center justify-center disabled:opacity-50"
                     >
                       {isSearchingMember ? <Loader2 className="animate-spin" size={20} /> : (locale === 'en' ? 'Search' : 'ค้นหา')}
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="p-8">
                   <h2 className="text-2xl font-black mb-2 text-center text-blue-600 uppercase">
                     {locale === 'en' ? 'Redeem Points' : 'แลกแต้มเป็นส่วนลด'}
                   </h2>
                   <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6 mb-6 text-center">
                     <h3 className="text-lg font-bold text-gray-700 mb-1">{selectedCustomer?.full_name}</h3>
                     <p className="text-sm text-gray-500 font-bold mb-4 uppercase">{selectedCustomer?.phone}</p>
                     
                     <div className="flex items-center justify-center gap-2 text-blue-700">
                       <span className="text-5xl font-black tracking-tighter">{selectedCustomer?.points || 0}</span>
                       <span className="text-xl font-bold uppercase mt-3">PTS</span>
                     </div>
                     <p className="text-sm font-bold text-blue-600/70 mt-2">
                       ( 1 {locale === 'en' ? 'Point' : 'แต้ม'} = {shopSettings?.loyalty_points_per_thb || 10} {locale === 'en' ? 'Baht' : 'บาท'} )
                     </p>
                   </div>
                   
                   <div className="mb-6">
                     <label className="block text-sm font-bold text-gray-600 mb-2">
                       {locale === 'en' ? 'Points to redeem' : 'ระบุจำนวนแต้มที่ต้องการใช้'}
                     </label>
                     <div className="relative">
                       <input
                         type="number"
                         value={redeemPointsAmount}
                         onChange={(e) => setRedeemPointsAmount(e.target.value)}
                         placeholder="0"
                         className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-6 text-2xl font-black text-center focus:outline-none focus:border-blue-600 focus:bg-white transition-all appearance-none"
                       />
                       <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold uppercase">
                         PTS
                       </div>
                     </div>
                     {redeemPointsAmount && parseInt(redeemPointsAmount) > 0 && (
                       <div className="text-center mt-3 text-emerald-600 font-black">
                         = {locale === 'en' ? 'Discount' : 'ส่วนลด'} {(parseInt(redeemPointsAmount) * (shopSettings?.loyalty_points_per_thb || 10)).toLocaleString()} {locale === 'en' ? 'Baht' : 'บาท'}
                       </div>
                     )}
                   </div>
                   
                   <div className="flex gap-3">
                     <button
                       onClick={() => {
                         setShowMemberCheckoutFlow(false);
                         setShowPaymentModal(true);
                       }}
                       className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all uppercase tracking-widest text-sm"
                     >
                       {locale === 'en' ? 'Do not use' : 'ไม่ใช้แต้ม'}
                     </button>
                     <button
                       onClick={handleApplyPointsDiscount}
                       disabled={!redeemPointsAmount || parseInt(redeemPointsAmount) <= 0 || parseInt(redeemPointsAmount) > (selectedCustomer?.points || 0)}
                       className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-sm disabled:opacity-50"
                     >
                       {locale === 'en' ? 'Apply & Pay' : 'ใช้แต้ม & ชำระเงิน'}
                     </button>
                   </div>
                 </div>
               )}`;

const uiReplacement = `               {memberCheckoutStep === 'lookup' ? (
                 <div className="p-8">
                   <div className="w-16 h-16 bg-[#1A1A18] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg mx-auto">
                     <QrCode size={32} />
                   </div>
                   <h2 className="text-3xl font-black mb-2 text-center text-[#1A1A18] tracking-tighter">
                     {locale === 'en' ? 'MEMBER CHECK' : 'ตรวจสอบสมาชิก'}
                   </h2>
                   <p className="text-gray-500 text-center mb-8 text-xs font-bold uppercase tracking-widest">
                     {locale === 'en' ? 'Enter phone or name' : 'ใส่เบอร์โทรศัพท์ หรือ ชื่อลูกค้า'}
                   </p>
                   
                   <div className="relative mb-6">
                     <input
                        type="text"
                        autoFocus
                        placeholder={locale === 'en' ? 'Phone Number or Name...' : 'เบอร์โทรศัพท์ หรือ ชื่อ...'}
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' && memberSearchResults.length > 0) {
                              setSelectedCustomer(memberSearchResults[0]);
                              setMemberCheckoutStep('points');
                              setMemberSearchResults([]);
                           } else if (e.key === 'Enter') {
                              handleSearchMemberFlow();
                           }
                        }}
                        className="w-full bg-[#f8f8f8] border-2 border-transparent focus:border-[#1A1A18] rounded-2xl py-5 px-6 text-xl font-bold transition-all focus:bg-white"
                     />
                     {memberSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-10 max-h-[250px] overflow-y-auto">
                           {memberSearchResults.map((m) => (
                              <button
                                 key={m.id}
                                 onClick={() => {
                                    setSelectedCustomer(m);
                                    setMemberCheckoutStep('points');
                                    setMemberSearchResults([]);
                                 }}
                                 className="w-full text-left px-6 py-4 hover:bg-gray-50 flex items-center justify-between transition-colors group"
                              >
                                 <div>
                                    <div className="font-black text-gray-800 text-lg group-hover:text-black transition-colors">{m.full_name || m.display_name || 'No Name'}</div>
                                    <div className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-1">{m.phone}</div>
                                 </div>
                                 <div className="text-[#1A1A18] font-black flex items-center gap-1 bg-gray-100 px-4 py-2 rounded-xl text-sm">
                                    {m.points || 0} PTS
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                   </div>
                   
                   <div className="flex gap-3">
                     <button
                       onClick={() => {
                         setShowMemberCheckoutFlow(false);
                         setShowPaymentModal(true);
                       }}
                       className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black font-black rounded-2xl transition-all uppercase tracking-widest text-[11px]"
                     >
                       {locale === 'en' ? 'Skip' : 'ข้าม (ไม่เป็นสมาชิก)'}
                     </button>
                     <button
                       onClick={handleSearchMemberFlow}
                       disabled={!memberSearchQuery.trim() || isSearchingMember}
                       className="flex-[2] py-5 bg-[#1A1A18] hover:bg-black text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[11px] flex items-center justify-center disabled:opacity-50"
                     >
                       {isSearchingMember ? <Loader2 className="animate-spin" size={18} /> : (locale === 'en' ? 'Search & Proceed' : 'ค้นหา')}
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="p-8">
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <h3 className="text-xl font-black text-[#1A1A18]">{selectedCustomer?.full_name || selectedCustomer?.display_name}</h3>
                       <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{selectedCustomer?.phone}</p>
                     </div>
                     <button 
                       onClick={() => {
                          setSelectedCustomer(null)
                          setMemberSearchQuery('')
                          setMemberCheckoutStep('lookup')
                       }}
                       className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#1A1A18] bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-all"
                     >
                       {locale === 'en' ? 'Change' : 'เปลี่ยนลูกค้า'}
                     </button>
                   </div>

                   <div className="bg-[#1A1A18] rounded-3xl p-8 mb-8 text-center text-white relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                     <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -ml-10 -mb-10"></div>
                     
                     <div className="text-xs font-black uppercase tracking-[0.3em] text-white/50 mb-2">Available Points</div>
                     <div className="flex items-center justify-center gap-2">
                       <span className="text-6xl font-black tracking-tighter">{selectedCustomer?.points || 0}</span>
                       <span className="text-xl font-bold uppercase mt-4 text-white/70">PTS</span>
                     </div>
                     <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs font-bold text-white/90">
                       <Award size={14} />
                       1 PTS = {shopSettings?.loyalty_points_per_thb || 10} ฿
                     </div>
                   </div>
                   
                   <div className="mb-8">
                     <div className="flex items-center justify-between mb-4">
                       <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
                         {locale === 'en' ? 'Redeem Points' : 'ระบุแต้มที่ใช้'}
                       </label>
                       {redeemPointsAmount && parseInt(redeemPointsAmount) > 0 && (
                         <div className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                           -{(parseInt(redeemPointsAmount) * (shopSettings?.loyalty_points_per_thb || 10)).toLocaleString()} ฿
                         </div>
                       )}
                     </div>
                     
                     <div className="grid grid-cols-4 gap-2 mb-4">
                        {[50, 100, 200].map(pts => {
                           const canUse = (selectedCustomer?.points || 0) >= pts;
                           // also check if this discount is larger than cart total
                           const valPerPoint = shopSettings?.loyalty_points_per_thb || 10;
                           const isOverBill = (pts * valPerPoint) > cartTotal;
                           return (
                              <button
                                 key={pts}
                                 disabled={!canUse || isOverBill}
                                 onClick={() => setRedeemPointsAmount(String(pts))}
                                 className="py-3 bg-gray-50 hover:bg-gray-100 text-[#1A1A18] font-black rounded-xl text-sm transition-all disabled:opacity-30"
                              >
                                 {pts}
                              </button>
                           )
                        })}
                        <button
                           disabled={(selectedCustomer?.points || 0) === 0}
                           onClick={() => {
                              const valPerPoint = shopSettings?.loyalty_points_per_thb || 10;
                              // Max points they can use is min(their points, cartTotal / valPerPoint)
                              const maxPtsForBill = Math.ceil(cartTotal / valPerPoint);
                              const ptsToUse = Math.min(selectedCustomer?.points || 0, maxPtsForBill);
                              setRedeemPointsAmount(String(ptsToUse));
                           }}
                           className="py-3 bg-[#1A1A18] hover:bg-black text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all disabled:opacity-30"
                        >
                           MAX
                        </button>
                     </div>
                     
                     <div className="relative">
                       <input
                         type="number"
                         value={redeemPointsAmount}
                         onChange={(e) => setRedeemPointsAmount(e.target.value)}
                         placeholder="0"
                         className="w-full bg-gray-50 border-2 border-transparent focus:border-[#1A1A18] rounded-2xl py-4 px-6 text-xl font-black focus:outline-none focus:bg-white transition-all appearance-none"
                       />
                       <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold uppercase tracking-widest text-sm">
                         PTS
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex gap-3">
                     <button
                       onClick={() => {
                         setShowMemberCheckoutFlow(false);
                         setShowPaymentModal(true);
                       }}
                       className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black font-black rounded-2xl transition-all uppercase tracking-widest text-[11px]"
                     >
                       {locale === 'en' ? 'Skip' : 'ไม่ใช้แต้ม'}
                     </button>
                     <button
                       onClick={handleApplyPointsDiscount}
                       disabled={!redeemPointsAmount || parseInt(redeemPointsAmount) <= 0 || parseInt(redeemPointsAmount) > (selectedCustomer?.points || 0)}
                       className="flex-[2] py-5 bg-[#1A1A18] hover:bg-black text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[11px] disabled:opacity-50 shadow-xl"
                     >
                       {locale === 'en' ? 'Apply & Pay' : 'ใช้แต้ม & ชำระเงิน'}
                     </button>
                   </div>
                 </div>
               )}`;

code = code.replace(uiTarget, uiReplacement);
fs.writeFileSync(filePath, code);
