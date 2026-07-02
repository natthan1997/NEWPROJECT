import fs from 'fs';

const filePath = 'components/pos/POSCategoryManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the return statement with the new design
const newReturn = `
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto pb-32">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={\`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl \${
              toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-[#1A1A18] text-white'
            }\`}
          >
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-[13px] font-bold tracking-wide">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">หมวดหมู่ทั้งหมด</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">จัดการและจัดเรียงหมวดหมู่เมนู</p>
        </div>
        <div className="flex items-center gap-3">
          {hasOrderChanges && (
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="h-10 px-6 rounded-full bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-600 transition-all active:scale-95"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              บันทึกลำดับ
            </button>
          )}
          <button
            onClick={openAdd}
            className="h-10 px-6 rounded-full bg-[#1A1A18] text-white flex items-center justify-center gap-2 shadow-md shadow-black/10 font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all active:scale-95"
          >
            <Plus size={16} />
            เพิ่มหมวดหมู่
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p className="text-sm font-bold">กำลังโหลดข้อมูล...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
            <Tag size={28} />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1">ยังไม่มีหมวดหมู่</h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">เพิ่มหมวดหมู่เพื่อจัดระเบียบเมนูของคุณ</p>
          <button
            onClick={openAdd}
            className="h-10 px-8 rounded-full bg-[#1A1A18] text-white font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all active:scale-95 shadow-md"
          >
            สร้างหมวดหมู่แรก
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <Reorder.Group axis="y" values={categories} onReorder={handleCategoryReorder} className="flex flex-col divide-y divide-gray-100">
            <AnimatePresence>
            {categories.map((cat, idx) => (
              <Reorder.Item
                key={cat.id}
                value={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-4 px-6 py-4 bg-white transition-colors hover:bg-gray-50/50 group"
              >
                {/* Grip */}
                <div className="flex cursor-grab justify-center text-gray-300 hover:text-gray-500 active:cursor-grabbing transition-colors">
                  <GripVertical size={20} />
                </div>

                {/* Info */}
                <div className="flex-1 flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100/80 text-gray-500">
                    <Tag size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-black text-gray-900 truncate">{cat.name}</div>
                    <div className="text-[12px] font-medium text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>ลำดับที่ {idx + 1}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className={\`\${(cat.item_count || 0) > 0 ? 'text-emerald-600 font-bold' : ''}\`}>
                        {cat.item_count || 0} รายการ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(cat)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>

                  {deleteConfirmId === cat.id ? (
                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-full">
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={saving}
                        className="h-7 px-3 rounded-full bg-red-500 text-white text-[10px] font-black tracking-wider hover:bg-red-600 transition-colors"
                      >
                        ยืนยัน
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if ((cat.item_count || 0) > 0) {
                          showToast(\`ไม่สามารถลบได้ — มีสินค้า \${cat.item_count} รายการอยู่ในหมวดนี้\`, 'error')
                        } else {
                          setDeleteConfirmId(cat.id)
                        }
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </Reorder.Item>
            ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-[15px] font-black tracking-tight text-gray-900">
                  {editingCat ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                </h3>
                <button 
                  onClick={() => setIsAddOpen(false)} 
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-1">
                    ชื่อหมวดหมู่
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="เช่น อาหารจานหลัก, เครื่องดื่ม..."
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] font-bold outline-none focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 h-12 rounded-full bg-gray-100 text-gray-700 font-black tracking-wide hover:bg-gray-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !formName.trim()}
                    className="flex-1 h-12 rounded-full bg-[#1A1A18] text-white font-black tracking-wide hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md shadow-black/10"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                    {editingCat ? 'บันทึก' : 'เพิ่ม'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
`;

const targetStart = content.indexOf('  return (');
content = content.substring(0, targetStart) + newReturn;

fs.writeFileSync(filePath, content);
console.log('POSCategoryManager updated');
