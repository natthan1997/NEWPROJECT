const fs = require('fs');
const path = '/Users/chenchirawongpothisan/Downloads/XYL to .com/components/pos/POSTerminal.tsx';
let content = fs.readFileSync(path, 'utf8');

const modalJSX_Bill = `          <div className="flex h-full w-full flex-col bg-white">
            <header className="flex items-center gap-4 border-b border-gray-100 bg-[#FDFDFB] p-6 sm:p-8 shrink-0">
              <button
                onClick={() => setShowBillDiscountModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-black">
                  ส่วนลดทั้งบิล
                </h3>
                <p className="mt-1 text-[10px] font-bold tracking-widest text-gray-500">
                  จัดการโปรโมชั่นหรือส่วนลดท้ายบิล
                </p>
              </div>
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  ประเภทส่วนลด
                </label>
                <div className="flex rounded-xl bg-gray-100 p-1">
                  <button
                    onClick={() => setBillDiscountModalType('fixed')}
                    className={\`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all \${
                      billDiscountModalType === 'fixed'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }\`}
                  >
                    ลดเป็นบาท (฿)
                  </button>
                  <button
                    onClick={() => setBillDiscountModalType('percent')}
                    className={\`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all \${
                      billDiscountModalType === 'percent'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }\`}
                  >
                    ลดเปอร์เซ็นต์ (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  มูลค่าส่วนลด
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-xl font-medium text-gray-400 pointer-events-none">
                    {billDiscountModalType === 'fixed' ? '฿' : '%'}
                  </div>
                  <input
                    type="number"
                    value={billDiscountInput}
                    onChange={e => setBillDiscountInput(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-gray-200 bg-white p-4 pl-12 text-2xl font-bold text-gray-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {activePromotions.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    โปรโมชั่นที่เปิดใช้งาน
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activePromotions.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setBillDiscountModalType(p.discount_type)
                          setBillDiscountInput(String(p.discount_value))
                          setBillDiscountReason(\`โปรโมชั่น: \${p.name}\`)
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-3.5 py-2 text-sm font-medium text-indigo-700 transition-all hover:bg-indigo-100"
                      >
                        <Tag size={14} className="text-indigo-500" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  เหตุผล (หมายเหตุ)
                </label>
                <input
                    type="text"
                    value={billDiscountReason}
                    onChange={e => setBillDiscountReason(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 transition-all focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <footer className="border-t border-gray-100 bg-[#FDFDFB] p-6 sm:p-8 shrink-0">
              <button
                onClick={applyBillDiscount}
                disabled={!billDiscountInput || Number(billDiscountInput) <= 0}
                className={\`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all \${
                  !billDiscountInput || Number(billDiscountInput) <= 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
                }\`}
              >
                ยืนยันส่วนลดทั้งบิล
              </button>
            </footer>
          </div>`;

const modalJSX_Item = `          <div className="flex h-full w-full flex-col bg-white">
            <header className="flex items-center gap-4 border-b border-gray-100 bg-[#FDFDFB] p-6 sm:p-8 shrink-0">
              <button
                onClick={() => setItemDiscountModalItem(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black uppercase tracking-tighter text-black truncate">
                  ส่วนลดรายการ
                </h3>
                <p className="mt-1 text-[10px] font-bold tracking-widest text-emerald-500 truncate">
                  {itemDiscountModalItem && getPrimaryMenuName(itemDiscountModalItem)}
                </p>
              </div>
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  ประเภทส่วนลด
                </label>
                <div className="flex rounded-xl bg-gray-100 p-1">
                  <button
                    onClick={() => setItemDiscountType('fixed')}
                    className={\`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all \${
                      itemDiscountType === 'fixed'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }\`}
                  >
                    ลดเป็นบาท (฿)
                  </button>
                  <button
                    onClick={() => setItemDiscountType('percent')}
                    className={\`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all \${
                      itemDiscountType === 'percent'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }\`}
                  >
                    ลดเปอร์เซ็นต์ (%)
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  มูลค่าส่วนลด
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-xl font-medium text-gray-400 pointer-events-none">
                    {itemDiscountType === 'fixed' ? '฿' : '%'}
                  </div>
                  <input
                    type="number"
                    value={itemDiscountValue}
                    onChange={e => setItemDiscountValue(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-gray-200 bg-white p-4 pl-12 text-2xl font-bold text-gray-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {activePromotions.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    โปรโมชั่นที่เปิดใช้งาน
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activePromotions.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setItemDiscountType(p.discount_type)
                          setItemDiscountValue(String(p.discount_value))
                          setItemDiscountReason(\`โปรโมชั่น: \${p.name}\`)
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-3.5 py-2 text-sm font-medium text-indigo-700 transition-all hover:bg-indigo-100"
                      >
                        <Tag size={14} className="text-indigo-500" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  เหตุผล (หมายเหตุ)
                </label>
                <input
                    type="text"
                    value={itemDiscountReason}
                    onChange={e => setItemDiscountReason(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 transition-all focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <footer className="border-t border-gray-100 bg-[#FDFDFB] p-6 sm:p-8 shrink-0">
              <button
                onClick={applyItemDiscount}
                disabled={!itemDiscountValue || Number(itemDiscountValue) <= 0}
                className={\`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-all \${
                  !itemDiscountValue || Number(itemDiscountValue) <= 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
                }\`}
              >
                ยืนยันส่วนลดรายการ
              </button>
            </footer>
          </div>`;

const cartTarget = '          <header className="flex flex-col gap-6 border-b border-gray-50 bg-[#FDFDFB] p-6 sm:p-8 xl:p-10">';
const cartCloseTarget = '              </div>\n            </footer>'; // We keep up to </footer>

let startIndex = content.indexOf(cartTarget);
let endIndex = content.indexOf(cartCloseTarget, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find cart target ranges");
  process.exit(1);
}

const originalCart = content.substring(startIndex, endIndex + cartCloseTarget.length);

let newStructure = `        {showBillDiscountModal ? (
${modalJSX_Bill}
        ) : itemDiscountModalItem ? (
${modalJSX_Item}
        ) : (
          <div className="flex h-full w-full flex-col">
${originalCart}
          </div>
        )}`;

let newContent = content.substring(0, startIndex) + newStructure + content.substring(endIndex + cartCloseTarget.length);

// Remove the old modals at the bottom
const itemModalStart = '{/* ITEM DISCOUNT MODAL */}';
const billModalEndStr = '{/* GLOBAL PRINT STYLES */}';

let modalStartIdx = newContent.indexOf(itemModalStart);
let modalEndIdx = newContent.indexOf(billModalEndStr, modalStartIdx);

if (modalStartIdx !== -1 && modalEndIdx !== -1) {
  newContent = newContent.substring(0, modalStartIdx) + newContent.substring(modalEndIdx);
} else {
  console.log("Warning: could not find old modals to delete");
}

fs.writeFileSync(path, newContent);
console.log("Done updating POSTerminal.tsx");
