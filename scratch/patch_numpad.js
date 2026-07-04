const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/POSTerminal.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const uiTarget = `                   <p className="text-gray-500 text-center mb-8 text-xs font-bold uppercase tracking-widest">
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
                 </div>`;

const uiReplacement = `                   <p className="text-gray-500 text-center mb-6 text-xs font-bold uppercase tracking-widest">
                     {locale === 'en' ? 'Enter phone number' : 'กรอกเบอร์โทรศัพท์ลูกค้า'}
                   </p>
                   
                   <div className="relative mb-6">
                     <div className="w-full bg-[#f8f8f8] border-2 border-transparent focus-within:border-[#1A1A18] rounded-2xl py-5 px-6 text-2xl font-black text-center tracking-[0.2em] transition-all bg-white min-h-[76px] flex items-center justify-center">
                        {memberSearchQuery || <span className="text-gray-300">0XX-XXX-XXXX</span>}
                     </div>
                     {memberSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-20 max-h-[250px] overflow-y-auto">
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
                   
                   <div className="grid grid-cols-3 gap-3 mb-6">
                     {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                       <button
                         key={num}
                         onClick={() => setMemberSearchQuery(prev => prev + num)}
                         className="h-14 bg-gray-50 hover:bg-gray-100 text-[#1A1A18] font-black text-xl rounded-2xl transition-all"
                       >
                         {num}
                       </button>
                     ))}
                     <button
                       onClick={() => setMemberSearchQuery('')}
                       className="h-14 bg-red-50 hover:bg-red-100 text-red-500 font-black text-sm uppercase tracking-widest rounded-2xl transition-all"
                     >
                       CLR
                     </button>
                     <button
                       onClick={() => setMemberSearchQuery(prev => prev + '0')}
                       className="h-14 bg-gray-50 hover:bg-gray-100 text-[#1A1A18] font-black text-xl rounded-2xl transition-all"
                     >
                       0
                     </button>
                     <button
                       onClick={() => setMemberSearchQuery(prev => prev.slice(0, -1))}
                       className="h-14 bg-gray-100 hover:bg-gray-200 text-[#1A1A18] flex items-center justify-center rounded-2xl transition-all"
                     >
                       <Delete size={20} />
                     </button>
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
                 </div>`;

code = code.replace(uiTarget, uiReplacement);
fs.writeFileSync(filePath, code);
