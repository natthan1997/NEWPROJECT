const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/POSTerminal.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add States
const stateTarget = `  const [showDeliveryCheckoutModal, setShowDeliveryCheckoutModal] = useState(false)`;
const stateReplacement = `  const [showDeliveryCheckoutModal, setShowDeliveryCheckoutModal] = useState(false)

  // Member Checkout Flow States
  const [showMemberCheckoutFlow, setShowMemberCheckoutFlow] = useState(false)
  const [memberCheckoutStep, setMemberCheckoutStep] = useState<'lookup' | 'points'>('lookup')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [isSearchingMember, setIsSearchingMember] = useState(false)
  const [redeemPointsAmount, setRedeemPointsAmount] = useState<string>('')`;
code = code.replace(stateTarget, stateReplacement);

// 2. Intercept Checkout
const checkoutTarget = `                    if (orderType === 'delivery') {
                      setShowDeliveryCheckoutModal(true)
                      return
                    }
                    setShowPaymentModal(true)`;
const checkoutReplacement = `                    if (orderType === 'delivery') {
                      setShowDeliveryCheckoutModal(true)
                      return
                    }
                    if (!selectedCustomer) {
                      setMemberCheckoutStep('lookup')
                      setMemberSearchQuery('')
                      setShowMemberCheckoutFlow(true)
                    } else {
                      setMemberCheckoutStep('points')
                      setRedeemPointsAmount('')
                      setShowMemberCheckoutFlow(true)
                    }`;
code = code.replace(checkoutTarget, checkoutReplacement);

// 3. Add handleSearchMember function (if not exists)
const searchMemberFunc = `
  const handleSearchMemberFlow = async () => {
    if (!memberSearchQuery.trim()) return;
    setIsSearchingMember(true);
    try {
      const { data, error } = await supabase
        .from('pos_members')
        .select('*')
        .or(\`phone.ilike.%\${memberSearchQuery}%,full_name.ilike.%\${memberSearchQuery}%,line_display_name.ilike.%\${memberSearchQuery}%\`)
        .limit(1)
        .maybeSingle();

      if (data) {
        setSelectedCustomer(data);
        setMemberCheckoutStep('points');
      } else {
        alert(locale === 'en' ? 'Member not found' : 'ไม่พบข้อมูลสมาชิก');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSearchingMember(false);
    }
  };

  const handleApplyPointsDiscount = () => {
    const pointsToUse = parseInt(redeemPointsAmount) || 0;
    if (pointsToUse <= 0 || !selectedCustomer) {
      setShowMemberCheckoutFlow(false);
      setShowPaymentModal(true);
      return;
    }
    
    const maxPoints = selectedCustomer.points || 0;
    if (pointsToUse > maxPoints) {
      alert(locale === 'en' ? 'Not enough points' : 'แต้มไม่เพียงพอ');
      return;
    }
    
    const valPerPoint = shopSettings?.loyalty_points_per_thb || 10;
    const discountValue = pointsToUse * valPerPoint;
    
    if (discountValue > cartTotal) {
       alert(locale === 'en' ? 'Discount exceeds cart total' : 'ส่วนลดเกินยอดบิล');
       return;
    }
    
    setBillDiscountModalType('fixed');
    setBillDiscountInput(String(discountValue));
    setBillDiscountReason('แลกแต้มสมาชิก (' + pointsToUse + ' pts)');
    
    // Automatically apply it (we need to mimic applyBillDiscount, or just set it and let applyBillDiscount run)
    // To be safe, we just set the states and then call applyBillDiscount logic manually:
    setDiscountTotalValue(discountValue);
    setDiscountTotalReason('แลกแต้มสมาชิก (' + pointsToUse + ' pts)');
    setShowBillDiscountModal(false);
    
    setShowMemberCheckoutFlow(false);
    setShowPaymentModal(true);
  };
`;

// Insert the functions just before `handleProcessPayment`
code = code.replace(`  const handleProcessPayment = async (method: string, amount?: number) => {`, searchMemberFunc + `\n  const handleProcessPayment = async (method: string, amount?: number) => {`);

// 4. Update Payment to handle point deduction
const paymentTarget = `          try {
            await supabase.rpc('increment_member_points', {
              user_id: selectedCustomer.line_user_id || selectedCustomer.id,
              points_to_add: pointsToEarn,
            })
            const historyObj: any = {
              member_id: selectedCustomer.line_user_id || selectedCustomer.id,
              order_id: finalOrderId,
              points: pointsToEarn,
              type: 'earn',
              description: \`ได้รับแต้มจากออเดอร์ \${finalOrderId.substring(0, 8)}\`
            }`;
            
const paymentReplacement = `          try {
            // First, if they used points for a discount, deduct them!
            let pointsRedeemed = 0;
            if (discountTotalReason && discountTotalReason.includes('แลกแต้มสมาชิก')) {
               const match = discountTotalReason.match(/\\((\\d+)\\s*pts\\)/);
               if (match && match[1]) {
                  pointsRedeemed = parseInt(match[1], 10);
               }
            }
            
            if (pointsRedeemed > 0) {
               await supabase.rpc('increment_member_points', {
                  user_id: selectedCustomer.line_user_id || selectedCustomer.id,
                  points_to_add: -pointsRedeemed,
               });
               await supabase.from('pos_points_history').insert({
                  member_id: selectedCustomer.line_user_id || selectedCustomer.id,
                  order_id: finalOrderId,
                  points: pointsRedeemed,
                  type: 'redeem',
                  description: \`ใช้แต้มเป็นส่วนลดออเดอร์ \${finalOrderId.substring(0, 8)}\`
               }).catch(() => {});
            }

            await supabase.rpc('increment_member_points', {
              user_id: selectedCustomer.line_user_id || selectedCustomer.id,
              points_to_add: pointsToEarn,
            })
            const historyObj: any = {
              member_id: selectedCustomer.line_user_id || selectedCustomer.id,
              order_id: finalOrderId,
              points: pointsToEarn,
              type: 'earn',
              description: \`ได้รับแต้มจากออเดอร์ \${finalOrderId.substring(0, 8)}\`
            }`;
code = code.replace(paymentTarget, paymentReplacement);

// 5. Add Modal UI
const modalUI = `
      {/* MEMBER CHECKOUT FLOW MODAL */}
      <AnimatePresence>
        {showMemberCheckoutFlow && (
          <div className="fixed inset-0 z-[2550] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowMemberCheckoutFlow(false);
                setShowPaymentModal(true);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
               {memberCheckoutStep === 'lookup' ? (
                 <div className="p-8">
                   <h2 className="text-2xl font-black mb-2 text-center text-[#1A1A18] uppercase">
                     {locale === 'en' ? 'Member Check' : 'ตรวจสอบสมาชิก'}
                   </h2>
                   <p className="text-gray-500 text-center mb-6 text-sm font-bold">
                     {locale === 'en' ? 'Enter phone number to check points' : 'ใส่เบอร์โทรศัพท์เพื่อตรวจสอบแต้มและรับสิทธิพิเศษ'}
                   </p>
                   
                   <input
                      type="text"
                      autoFocus
                      placeholder={locale === 'en' ? 'Phone Number...' : 'เบอร์โทรศัพท์...'}
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                            handleSearchMemberFlow();
                         }
                      }}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-6 text-xl font-bold mb-4 focus:outline-none focus:border-black transition-all"
                   />
                   
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
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;
code = code.replace(`      {/* DELIVERY CHECKOUT MODAL */}`, modalUI + `\n      {/* DELIVERY CHECKOUT MODAL */}`);

fs.writeFileSync(filePath, code);
