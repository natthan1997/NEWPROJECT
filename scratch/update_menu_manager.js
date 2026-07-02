import fs from 'fs';
const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add props to the interface
content = content.replace(
  'shopSettings?: any',
  'shopSettings?: any\n  forceViewMode?: "grid" | "table" | "stock"\n  hideStockToggle?: boolean'
);

content = content.replace(
  'activeShift, setViewExtraHeader, shopSettings',
  'activeShift, setViewExtraHeader, shopSettings, forceViewMode, hideStockToggle'
);

// Modify initial state of viewMode
content = content.replace(
  "const [viewMode, setViewMode] = useState<'grid' | 'table' | 'stock'>('grid')",
  "const [viewMode, setViewMode] = useState<'grid' | 'table' | 'stock'>(forceViewMode || 'grid')"
);

// Listen to forceViewMode changes
content = content.replace(
  "const sortMenuItems = (list: any[]) => sortMenuItemsByOrder(list)",
  "const sortMenuItems = (list: any[]) => sortMenuItemsByOrder(list)\n\n  useEffect(() => {\n    if (forceViewMode) setViewMode(forceViewMode)\n  }, [forceViewMode])"
);

// Modify the view toggles to hide stock button if hideStockToggle is true
// and if forceViewMode is 'stock', hide the whole toggle group
const oldToggleGroup = `<div className="flex items-center gap-2 p-1 bg-gray-50 border border-gray-100 mr-2">
                   <button 
                       onClick={() => setViewMode('grid')} 
                       className={\`w-10 h-10 flex items-center justify-center transition-all \${viewMode === 'grid' ? 'bg-[#1A1A18] text-white shadow-lg' : 'text-gray-300 hover:text-black'}\`}
                   >
                       <LayoutGrid size={18} />
                   </button>
                   <button 
                       onClick={() => setViewMode('table')} 
                       className={\`w-10 h-10 flex items-center justify-center transition-all \${viewMode === 'table' ? 'bg-[#1A1A18] text-white shadow-lg' : 'text-gray-300 hover:text-black'}\`}
                   >
                       <List size={18} />
                   </button>
                   <button 
                       onClick={() => setViewMode('stock')} 
                       className={\`px-4 h-10 flex items-center justify-center gap-2 transition-all \${viewMode === 'stock' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}\`}
                   >
                       <ToggleRight size={18} />
                       <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Stock Control</span>
                   </button>
               </div>`;

const newToggleGroup = `{forceViewMode !== 'stock' && (
              <div className="flex items-center gap-2 p-1 bg-gray-50 border border-gray-100 mr-2">
                   <button 
                       onClick={() => setViewMode('grid')} 
                       className={\`w-10 h-10 flex items-center justify-center transition-all \${viewMode === 'grid' ? 'bg-[#1A1A18] text-white shadow-lg' : 'text-gray-300 hover:text-black'}\`}
                   >
                       <LayoutGrid size={18} />
                   </button>
                   <button 
                       onClick={() => setViewMode('table')} 
                       className={\`w-10 h-10 flex items-center justify-center transition-all \${viewMode === 'table' ? 'bg-[#1A1A18] text-white shadow-lg' : 'text-gray-300 hover:text-black'}\`}
                   >
                       <List size={18} />
                   </button>
                   {!hideStockToggle && (
                     <button 
                         onClick={() => setViewMode('stock')} 
                         className={\`px-4 h-10 flex items-center justify-center gap-2 transition-all \${viewMode === 'stock' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}\`}
                     >
                         <ToggleRight size={18} />
                         <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Stock Control</span>
                     </button>
                   )}
               </div>
              )}`;

content = content.replace(oldToggleGroup, newToggleGroup);

fs.writeFileSync(filePath, content);
console.log('Successfully updated POSMenuManager.tsx');
