import re

file_path = "components/pos/POSInventoryManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

start_idx = content.find("{/* SUPPLIER MANAGER MODAL */}")
# We need to find the matching AnimatePresence or the end of it.
# Actually, it's just the Supplier Manager div.
end_idx = content.find("        {/* SHOPPING LIST MODAL */}", start_idx)
if end_idx == -1:
    end_idx = content.find("      </AnimatePresence>", start_idx)

supplier_content = content[start_idx:end_idx]

early_return = """
  if (isSupplierManagerOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 md:px-8 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSupplierManagerOpen(false)} className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[#1A1A18] flex items-center gap-2">
              <Settings size={24} className="text-black" />
              {locale === 'en' ? 'Manage Suppliers' : locale === 'zh' ? 'Manage Suppliers' : 'จัดการแหล่งจัดซื้อ'}
            </h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
"""

inner_start = content.find("{/* Create New Supplier */}", start_idx)
inner_end = content.find("               </div>", inner_start)

early_return += content[inner_start:inner_end]
early_return += """
        </div>
      </div>
    );
  }
"""

insert_idx = content.find("return (", content.find("] as const"))

new_content = content[:insert_idx] + early_return + "\n  " + content[insert_idx:start_idx] + content[end_idx:]

with open(file_path, "w") as f:
    f.write(new_content)
    
print("Successfully refactored Supplier Manager")
