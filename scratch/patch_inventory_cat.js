const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/pos/POSInventoryManager.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add Import
code = code.replace(
  "import { useI18n } from '@/lib/I18nContext'",
  "import { useI18n } from '@/lib/I18nContext'\nimport POSInventoryCategoryManager from './POSInventoryCategoryManager'"
);

// 2. Add State
const stateTarget = `const [isShoppingListOpen, setIsShoppingListOpen] = useState(false)`;
const stateReplacement = `const [isShoppingListOpen, setIsShoppingListOpen] = useState(false)\n  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)`;
code = code.replace(stateTarget, stateReplacement);

// 3. Add Button
const buttonTarget = `<button onClick={() => setIsShoppingListOpen(true)} className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase text-amber-600 hover:text-amber-800 transition-colors"><ShoppingCart size={12} className="text-amber-400" /> {locale === 'en' ? 'รายการที่ต้องซื้อ' : locale === 'zh' ? 'รายการที่ต้องซื้อ' : 'รายการที่ต้องซื้อ'}</button>`;
const buttonReplacement = `<button onClick={() => setIsShoppingListOpen(true)} className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase text-amber-600 hover:text-amber-800 transition-colors"><ShoppingCart size={12} className="text-amber-400" /> {locale === 'en' ? 'รายการที่ต้องซื้อ' : locale === 'zh' ? 'รายการที่ต้องซื้อ' : 'รายการที่ต้องซื้อ'}</button>\n                            <button onClick={() => setIsCategoryManagerOpen(true)} className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase text-teal-600 hover:text-teal-800 transition-colors"><Tag size={12} className="text-teal-400" /> {locale === 'en' ? 'จัดการหมวดหมู่' : 'จัดการหมวดหมู่'}</button>`;
code = code.replace(buttonTarget, buttonReplacement);

// 4. Add Modal
const modalTarget = `{isRestockOpen && (`;
const modalReplacement = `{isCategoryManagerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#1A1A18]/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative">
            <header className="shrink-0 px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">จัดการหมวดหมู่คลังสินค้า</h2>
                <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Inventory Categories</p>
              </div>
              <button 
                onClick={() => {
                  setIsCategoryManagerOpen(false);
                  fetchInventory(); // Refresh after closing just in case
                }}
                className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto relative bg-[#FDFDFB]">
               <POSInventoryCategoryManager shopSettings={shopSettings} onCategoriesChange={() => {}} />
            </div>
          </div>
        </div>
      )}

      {isRestockOpen && (`;
code = code.replace(modalTarget, modalReplacement);

fs.writeFileSync(filePath, code);
