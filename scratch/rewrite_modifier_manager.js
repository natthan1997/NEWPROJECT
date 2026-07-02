import fs from 'fs';

const filePath = 'components/pos/POSModifierManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = '  return (\n    <div className="no-scrollbar relative min-h-full overflow-y-auto p-4 font-bold sm:p-10">';
const targetStart = content.indexOf(targetStr);

if (targetStart === -1) {
    console.log("Could not find the target string in POSModifierManager.tsx");
    process.exit(1);
}

const newReturn = `  return (
    <div className="no-scrollbar relative min-h-full overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto pb-32">
      
      {/* HEADER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">ตัวเลือกเสริม</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">จัดการกลุ่มตัวเลือกและรายละเอียด (Modifiers)</p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isSortMode && (
            <div className="relative group w-full md:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1A1A18] transition-colors" />
                <input 
                    type="text" 
                    placeholder={locale === 'en' ? 'ค้นหาชื่อตัวเลือกเสริม...' : 'ค้นหาชื่อตัวเลือกเสริม...'} 
                    className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-[13px] font-bold outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all placeholder:text-gray-400 text-gray-900 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          )}
          <button
            onClick={() => openGroupEditor()}
            className="h-10 px-6 rounded-full bg-[#1A1A18] text-white flex items-center justify-center gap-2 shadow-md shadow-black/10 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all active:scale-95 shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">เพิ่มกลุ่มตัวเลือก</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p className="text-sm font-bold">กำลังโหลดข้อมูล...</p>
        </div>
      ) : isSortMode ? (
        <div className="mx-auto w-full max-w-3xl pb-32">
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-amber-200 rounded-2xl bg-amber-50/50 p-4 sm:p-5 text-amber-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div className="text-[12px] font-black uppercase tracking-widest">
                Sorting Mode: ลากเพื่อจัดเรียงลำดับใหม่
              </div>
            </div>
            {isSavingOrder && (
              <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full border border-amber-100">
                <Loader2 size={16} className="animate-spin text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">กำลังบันทึก...</span>
              </div>
            )}
          </div>
          <Reorder.Group
            axis="y"
            values={groups}
            onReorder={handleReorderGroups}
            className="space-y-4"
          >
            {groups.map((group: any) => (
              <ModifierGroupItem
                key={group.id}
                group={group}
                onReorderOptions={newOptions => handleReorderOptions(group.id, newOptions)}
              />
            ))}
          </Reorder.Group>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map(group => (
            <div
              key={group.id}
              className="group flex flex-col bg-white rounded-[24px] border border-gray-100 transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 overflow-hidden"
            >
              <header className="flex items-start justify-between bg-gray-50/50 p-6 pb-4 border-b border-gray-100">
                <div className="flex-1 pr-4">
                  <h3 className="text-[15px] font-black uppercase tracking-tight text-gray-900 leading-tight">
                    {group.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 shadow-sm">
                      {group.min_select === 0 ? 'ระบุหรือไม่ก็ได้' : \`ต้องเลือกอย่างน้อย \${group.min_select}\`}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      สูงสุด {group.max_select}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => openGroupEditor(group)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-400 transition-all hover:border-black hover:text-black hover:shadow-sm"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 text-red-300 transition-all hover:border-red-500 hover:text-red-500 hover:shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </header>
              
              <div className="flex-1 p-2">
                <div className="space-y-1">
                  {group.options?.map((opt: any) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-3 px-4 rounded-2xl transition-colors hover:bg-gray-50 group/opt"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={\`w-2 h-2 rounded-full shrink-0 \${opt.is_active ? 'bg-emerald-500' : 'bg-gray-300'}\`} />
                        <span className="text-[13px] font-black text-gray-700 truncate">
                          {opt.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 pl-4">
                        {opt.price_adjustment > 0 && (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-100/50">
                            + ฿{opt.price_adjustment}
                          </span>
                        )}
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/opt:opacity-100 transition-opacity">
                          <button
                            onClick={() => openOptionEditor(group, opt)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteOption(opt.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-red-300 hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => openOptionEditor(group)}
                    className="w-full mt-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-400 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> เพิ่มตัวเลือกย่อย
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
          {/* Table view remains mostly identical but needs some rounding adjustments. For brevity we leave as is or update minimally */}
          <table className="w-full text-left font-bold text-black border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Option Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Group Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Price Adj.</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOptions.map((opt) => (
                 <tr key={opt.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-[13px] font-black">{opt.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-600">{opt.group_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      {opt.price_adjustment > 0 ? (
                        <span className="text-emerald-600 text-[12px] font-black">+ ฿{opt.price_adjustment}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-black hover:border-black"><Edit3 size={14} /></button>
                         <button className="p-2 bg-white border border-red-100 rounded-full text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500"><Trash2 size={14} /></button>
                       </div>
                    </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {/* GROUP EDITOR */}
      {isGroupEditorOpen && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsGroupEditorOpen(false)}
          ></div>
          <div className="animate-in zoom-in-95 relative flex w-full max-w-lg flex-col bg-white rounded-[32px] shadow-2xl p-8 overflow-hidden">
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                  {editingGroup.id ? 'แก้ไขกลุ่มตัวเลือก' : 'เพิ่มกลุ่มตัวเลือก'}
                </h2>
                <p className="mt-1 text-[11px] font-black tracking-widest text-gray-400 uppercase">Modifier Group</p>
              </div>
              <button
                onClick={() => setIsGroupEditorOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </header>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">
                  ชื่อกลุ่ม (เช่น ความหวาน, ท็อปปิ้ง)
                </label>
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-bold outline-none focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                  placeholder="พิมพ์ชื่อกลุ่มตัวเลือก"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">
                    เลือกอย่างน้อย (Min)
                  </label>
                  <input
                    type="number"
                    value={editingGroup.min_select}
                    onChange={e => setEditingGroup({ ...editingGroup, min_select: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-bold outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">
                    เลือกได้สูงสุด (Max)
                  </label>
                  <input
                    type="number"
                    value={editingGroup.max_select}
                    onChange={e => setEditingGroup({ ...editingGroup, max_select: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-bold outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">
                  ผูกกับรายการเมนู (Link to items)
                </label>
                <div className="h-48 overflow-y-auto border border-gray-200 rounded-2xl divide-y divide-gray-100 bg-white">
                  {allMenuItems.map(item => {
                    const isActive = groupLinks.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (isActive) setGroupLinks(prev => prev.filter(id => id !== item.id))
                          else setGroupLinks(prev => [...prev, item.id])
                        }}
                        className={\`w-full flex items-center justify-between px-4 py-3 text-left transition-colors \${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'}\`}
                      >
                        <span className={\`text-[13px] font-black \${isActive ? 'text-emerald-900' : 'text-gray-700'}\`}>
                          {item.name}
                        </span>
                        {isActive && <Check size={16} className="text-emerald-500" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsGroupEditorOpen(false)}
                className="flex-1 h-14 rounded-full bg-gray-100 text-gray-700 font-black tracking-wide hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={isSaving}
                className="flex-1 h-14 rounded-full bg-[#1A1A18] text-white font-black tracking-wide hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                บันทึกกลุ่ม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPTION EDITOR */}
      {isOptionEditorOpen && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOptionEditorOpen(false)}
          ></div>
          <div className="animate-in zoom-in-95 relative flex w-full max-w-md flex-col bg-white rounded-[32px] shadow-2xl p-8 overflow-hidden">
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                  {editingOption.id ? 'แก้ไขตัวเลือกย่อย' : 'เพิ่มตัวเลือกย่อย'}
                </h2>
                <p className="mt-1 text-[11px] font-black tracking-widest text-gray-400 uppercase">Modifier Option</p>
              </div>
              <button
                onClick={() => setIsOptionEditorOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </header>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">
                  ชื่อรายการ (เช่น นมโอ๊ต, หวานน้อย)
                </label>
                <input
                  type="text"
                  value={editingOption.name}
                  onChange={e => setEditingOption({ ...editingOption, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-bold outline-none focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                  placeholder="ระบุชื่อตัวเลือก"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">
                  ราคาที่บวกเพิ่ม (+)
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[15px] font-black text-emerald-600">฿</span>
                  <input
                    type="number"
                    value={editingOption.price_adjustment}
                    onChange={e => setEditingOption({ ...editingOption, price_adjustment: Number(e.target.value) })}
                    className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl pl-12 pr-5 py-4 text-[15px] font-black text-emerald-700 outline-none focus:bg-emerald-50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-[11px] font-bold text-blue-700 leading-relaxed">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
                <p>Note: คุณสามารถผูกตัวเลือกนี้เข้ากับวัตถุดิบใน "Recipe Lab" ได้หลังจากบันทึกแล้ว เพื่อตัดสต็อกตามตัวเลือก</p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsOptionEditorOpen(false)}
                className="flex-1 h-14 rounded-full bg-gray-100 text-gray-700 font-black tracking-wide hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveOption}
                disabled={isSaving}
                className="flex-1 h-14 rounded-full bg-[#1A1A18] text-white font-black tracking-wide hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                บันทึกตัวเลือก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
`;

content = content.substring(0, targetStart) + newReturn;
fs.writeFileSync(filePath, content);
console.log('POSModifierManager updated');
