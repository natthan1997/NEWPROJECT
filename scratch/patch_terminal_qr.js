const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/POSTerminal.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Fix QR Icon checkmark
const qrTarget = `              <button
                onClick={() => setShowPointModal(true)}
                className={\`relative flex h-9 w-9 sm:h-10 sm:w-10 rounded-full items-center justify-center border font-bold transition-all \${selectedCustomer ? 'border-black bg-[#1A1A18] text-white shadow-lg' : 'border-[#F0F0E8] bg-white text-[#1A1A18] hover:border-black'}\`}
                title={locale === 'en' ? 'สะสมแต้ม' : locale === 'zh' ? 'สะสมแต้ม' : 'สะสมแต้ม'}
              >
                <QrCode size={16} />
                {selectedCustomer && (
                  <span className="absolute -right-0 -top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[7px] font-black text-white ring-1 ring-white">
                    ✓
                  </span>
                )}
              </button>`;

const qrReplacement = `              <button
                onClick={() => setShowPointModal(true)}
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 rounded-full items-center justify-center border border-[#F0F0E8] bg-white text-[#1A1A18] hover:border-black font-bold transition-all"
                title={locale === 'en' ? 'สะสมแต้ม' : locale === 'zh' ? 'สะสมแต้ม' : 'ให้แต้ม'}
              >
                <QrCode size={16} />
              </button>`;

code = code.replace(qrTarget, qrReplacement);

// Fix Apply & Pay button logic
const buttonTarget = `                    <div className="flex gap-3">
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
                    </div>`;

const buttonReplacement = `                    {parseInt(redeemPointsAmount) * (shopSettings?.opening_hours?.loyalty_points_per_thb || 10) > cartTotal && cartTotal > 0 && (
                      <div className="text-[10px] font-bold text-red-500 mb-2 text-center uppercase tracking-widest">
                        {locale === 'en' ? 'Discount exceeds bill total!' : 'ส่วนลดเกินยอดบิล!'}
                      </div>
                    )}
                    {cartTotal === 0 && (
                      <div className="text-[10px] font-bold text-orange-500 mb-2 text-center uppercase tracking-widest">
                        {locale === 'en' ? 'Cart is empty' : 'ยังไม่มีรายการอาหารในบิล'}
                      </div>
                    )}
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
                        disabled={
                           !redeemPointsAmount || 
                           parseInt(redeemPointsAmount) <= 0 || 
                           parseInt(redeemPointsAmount) > (selectedCustomer?.points || 0) ||
                           (parseInt(redeemPointsAmount) * (shopSettings?.opening_hours?.loyalty_points_per_thb || 10) > cartTotal)
                        }
                        className="flex-[2] py-5 bg-[#1A1A18] hover:bg-black text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[11px] disabled:opacity-50 shadow-xl"
                      >
                        {locale === 'en' ? 'Apply & Pay' : 'ใช้แต้ม & ชำระเงิน'}
                      </button>
                    </div>`;

code = code.replace(buttonTarget, buttonReplacement);

fs.writeFileSync(filePath, code);
