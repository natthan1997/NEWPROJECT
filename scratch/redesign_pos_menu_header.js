import fs from 'fs';

const filePath = '/Users/chenchirawongpothisan/Downloads/XYLPROJECT/components/pos/POSMenuManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStart = content.indexOf('    setViewExtraHeader(');
const targetEnd = content.indexOf('    return () => setViewExtraHeader(null);');

if (targetStart === -1 || targetEnd === -1) {
  console.log('Could not find target block');
  process.exit(1);
}

const newRender = `    setViewExtraHeader(
      <div className="flex flex-wrap items-center justify-between w-full gap-3 py-1">
          {/* View Modes */}
          <div className="flex items-center gap-2">
              {forceViewMode !== 'stock' && (
              <div className="flex items-center p-1 bg-gray-100/80 rounded-full border border-gray-200/50">
                   <button 
                       onClick={() => setViewMode('grid')} 
                       className={\`w-10 h-8 rounded-full flex items-center justify-center transition-all \${viewMode === 'grid' ? 'bg-white text-[#1A1A18] shadow-sm font-bold' : 'text-gray-500 hover:text-black'}\`}
                       title="Grid View"
                   >
                       <LayoutGrid size={16} />
                   </button>
                   <button 
                       onClick={() => setViewMode('table')} 
                       className={\`w-10 h-8 rounded-full flex items-center justify-center transition-all \${viewMode === 'table' ? 'bg-white text-[#1A1A18] shadow-sm font-bold' : 'text-gray-500 hover:text-black'}\`}
                       title="List View"
                   >
                       <List size={16} />
                   </button>
               </div>
              )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 ml-auto">
              {!hideStockToggle && forceViewMode !== 'stock' && (
                  <button 
                      onClick={() => setViewMode(viewMode === 'stock' ? 'grid' : 'stock')} 
                      className={\`h-10 px-5 rounded-full flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] \${viewMode === 'stock' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}\`}
                  >
                      <ToggleRight size={16} />
                      <span className="hidden sm:inline">{viewMode === 'stock' ? 'ปิดโหมดสต็อก' : 'อัปเดตสต็อก'}</span>
                  </button>
              )}
              
              <button
                  onClick={reorderMode ? handleCancelReorder : handleStartReorder}
                  className={\`h-10 px-5 rounded-full flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] border \${
                      reorderMode
                        ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }\`}
              >
                  {reorderMode ? <X size={14} /> : <MenuIcon size={14} />}
                  <span className="hidden sm:inline">{reorderMode ? 'ยกเลิก' : 'จัดลำดับ'}</span>
              </button>

              {reorderMode && dirtyCategoryKeys.length > 0 && (
                <button
                    onClick={handleSaveReorder}
                    className="h-10 px-6 rounded-full bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all active:scale-95"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span className="hidden sm:inline">บันทึกลำดับ</span>
                </button>
              )}
              
              <button 
                  onClick={() => { setEditingItem({ name: '', name_en: '', name_zh: '', sale_price: 0, status: 'active', category_id: categories[0]?.id }); setIsEditorOpen(true); }} 
                  className="h-10 px-6 rounded-full bg-[#1A1A18] text-white flex items-center justify-center gap-2 shadow-md shadow-black/10 font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all active:scale-95"
              >
                  <Plus size={16} /> 
                  <span className="hidden sm:inline">{locale === 'en' ? 'Add Menu' : locale === 'zh' ? 'เพิ่มรายการเมนู' : 'เพิ่มเมนู'}</span>
              </button>
          </div>
      </div>
    );
`;

const newContent = content.substring(0, targetStart) + newRender + content.substring(targetEnd);
fs.writeFileSync(filePath, newContent);
console.log('Successfully redesigned menu manager header');
