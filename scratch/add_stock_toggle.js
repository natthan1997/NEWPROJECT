import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `<button 
                       onClick={() => setViewMode('table')} 
                       className={\`w-10 h-10 flex items-center justify-center transition-all \${viewMode === 'table' ? 'bg-[#1A1A18] text-white shadow-lg' : 'text-gray-300 hover:text-black'}\`}
                   >
                       <List size={18} />
                   </button>
               </div>`;

const replacement = `<button 
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

content = content.replace(target, replacement);

fs.writeFileSync(filePath, content);
console.log("Updated toggle buttons in POSMenuManager.tsx");
