import re

file_path = "components/pos/POSInventoryManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

start_idx = content.find("{/* EDIT MODAL */}")
end_idx = content.find("{/* QUICK SUMMARY MODAL */}", start_idx)

editor_content = content[start_idx:end_idx]

early_return = """
  if (isEditorOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 md:px-8 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsEditorOpen(false)} className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[#1A1A18]">{editingItem.id ? 'Edit Material' : 'New Material'}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8C8A81] leading-none">Inventory Management Portal</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 font-bold">
"""

inner_start = content.find('<div className="grid grid-cols-2', start_idx)
inner_end = content.find("              <footer", inner_start)

early_return += content[inner_start:inner_end]

footer_start = content.find("<footer", inner_start)
footer_end = content.find("</footer>", footer_start) + 9
early_return += content[footer_start:footer_end]

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
    
print("Successfully refactored Editor")
