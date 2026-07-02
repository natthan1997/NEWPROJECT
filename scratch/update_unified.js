import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSManagementUnified.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update ManagementTab type
content = content.replace(
  "type ManagementTab = 'resources' | 'assets' | 'categories' | 'logic' | 'audit'",
  "type ManagementTab = 'resources' | 'menu_system' | 'stock_control' | 'recipes' | 'audit'"
);

// 2. Add inner tab state and Icons
content = content.replace(
  "const [activeTab, setActiveTab] = useState<ManagementTab>('resources')",
  "const [activeTab, setActiveTab] = useState<ManagementTab>('resources')\n  const [menuInnerTab, setMenuInnerTab] = useState<'items' | 'categories' | 'modifiers'>('items')"
);

// Add LayoutGrid, Tag, SlidersHorizontal, ToggleRight if not already imported
content = content.replace(
  "import { BarChart3 } from 'lucide-react'",
  "import { BarChart3, LayoutGrid, SlidersHorizontal, ToggleRight } from 'lucide-react'"
);

// 3. Update tabs array
const oldTabsStr = `  const tabs = [
    { id: 'resources', label: 'คลังพัสดุ', sub: 'Resources', icon: Package },
    { id: 'assets', label: 'จัดการเมนู', sub: 'Menu Assets', icon: Layers },
    { id: 'categories', label: 'หมวดหมู่', sub: 'Categories', icon: Tag },
    { id: 'logic', label: 'สูตรและตัวเลือก', sub: 'Logic & Recipes', icon: FlaskConical },
    { id: 'audit', label: 'สรุปการตรวจนับ', sub: 'Audit & Sync', icon: ClipboardCheck },
  ]`;

const newTabsStr = `  const tabs = [
    { id: 'resources', label: 'คลังพัสดุ', sub: 'Resources', icon: Package },
    { id: 'menu_system', label: 'ระบบจัดการเมนู', sub: 'Menu System', icon: Layers },
    { id: 'stock_control', label: 'อัปเดตสต็อก', sub: 'Stock Control', icon: ToggleRight },
    { id: 'recipes', label: 'สูตรตัดสต็อก', sub: 'Recipes', icon: FlaskConical },
    { id: 'audit', label: 'สรุปการตรวจนับ', sub: 'Audit & Sync', icon: ClipboardCheck },
  ]`;

content = content.replace(oldTabsStr, newTabsStr);

// 4. Update the AnimatePresence children
const oldContentArea = content.substring(content.indexOf('{/* MAIN CONTENT AREA */}'), content.indexOf('</AnimatePresence>'));

const newContentArea = `{/* MAIN CONTENT AREA */}
      <div className="no-scrollbar flex-1 overflow-y-auto bg-[#F5F4F0]/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'resources' && (
              <POSInventoryManager
                profile={profile}
                activeView={activeView}
                allowedNav={[]}
                onSetView={() => {}}
                setViewExtraHeader={setViewExtraHeader}
                categories={inventoryCategories}
                shopSettings={shopSettings}
              />
            )}
            {activeTab === 'menu_system' && (
              <div className="flex h-full overflow-hidden bg-white">
                {/* Inner Sidebar */}
                <div className="w-64 shrink-0 border-r border-gray-100 bg-gray-50/50 p-6 flex flex-col gap-2">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Menu System Config</h3>
                   
                   <button
                     onClick={() => setMenuInnerTab('items')}
                     className={\`flex items-center gap-3 px-4 py-4 rounded-xl transition-all \${menuInnerTab === 'items' ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:bg-gray-100'}\`}
                   >
                     <LayoutGrid size={18} className={menuInnerTab === 'items' ? 'text-blue-500' : ''} />
                     <div className="text-left flex-1">
                        <div className="text-xs font-black">รายการเมนู</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Menu Items</div>
                     </div>
                   </button>
                   
                   <button
                     onClick={() => setMenuInnerTab('categories')}
                     className={\`flex items-center gap-3 px-4 py-4 rounded-xl transition-all \${menuInnerTab === 'categories' ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:bg-gray-100'}\`}
                   >
                     <Tag size={18} className={menuInnerTab === 'categories' ? 'text-purple-500' : ''} />
                     <div className="text-left flex-1">
                        <div className="text-xs font-black">หมวดหมู่</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Categories</div>
                     </div>
                   </button>
                   
                   <button
                     onClick={() => setMenuInnerTab('modifiers')}
                     className={\`flex items-center gap-3 px-4 py-4 rounded-xl transition-all \${menuInnerTab === 'modifiers' ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:bg-gray-100'}\`}
                   >
                     <SlidersHorizontal size={18} className={menuInnerTab === 'modifiers' ? 'text-emerald-500' : ''} />
                     <div className="text-left flex-1">
                        <div className="text-xs font-black">ตัวเลือกเสริม</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Modifiers</div>
                     </div>
                   </button>
                </div>
                
                {/* Inner Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar relative">
                   {menuInnerTab === 'items' && (
                     <POSMenuManager
                        profile={profile}
                        activeView={activeView}
                        allowedNav={[]}
                        onSetView={() => {}}
                        setViewExtraHeader={setViewExtraHeader}
                        shopSettings={shopSettings}
                        hideStockToggle={true}
                      />
                   )}
                   {menuInnerTab === 'categories' && (
                      <POSCategoryManager
                        shopSettings={shopSettings}
                        onCategoriesChange={(cats) => setCategories(cats)}
                      />
                   )}
                   {menuInnerTab === 'modifiers' && (
                     <div className="p-10 pb-0">
                       <h2 className="mb-2 text-xl font-black uppercase tracking-tighter">จัดการตัวเลือกเสริม (Modifiers)</h2>
                       <p className="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                         Create global and item-specific customization groups
                       </p>
                       <POSModifierManager
                         profile={profile}
                         activeView={activeView}
                         allowedNav={[]}
                         onSetView={() => {}}
                         setViewExtraHeader={setViewExtraHeader}
                         shopSettings={shopSettings}
                       />
                     </div>
                   )}
                </div>
              </div>
            )}
            
            {activeTab === 'stock_control' && (
              <POSMenuManager
                profile={profile}
                activeView={activeView}
                allowedNav={[]}
                onSetView={() => {}}
                setViewExtraHeader={setViewExtraHeader}
                shopSettings={shopSettings}
                forceViewMode="stock"
              />
            )}
            
            {activeTab === 'recipes' && (
              <div className="flex h-full flex-col overflow-hidden">
                <div className="no-scrollbar flex-1 overflow-y-auto">
                  <div className="p-10 pb-0">
                    <h2 className="mb-2 text-xl font-black uppercase tracking-tighter">จัดการสูตรตัดสต็อก (Recipes)</h2>
                    <p className="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Link menu items to inventory resources
                    </p>
                  </div>
                  <POSRecipeManager
                    profile={profile}
                    activeView={activeView}
                    allowedNav={[]}
                    onSetView={() => {}}
                    setViewExtraHeader={setViewExtraHeader}
                    shopSettings={shopSettings}
                  />
                </div>
              </div>
            )}
`;

content = content.replace(oldContentArea, newContentArea);

fs.writeFileSync(filePath, content);
console.log('Updated POSManagementUnified.tsx');
