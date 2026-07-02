import re

file_path = "components/pos/POSInventoryManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

start_idx = content.find("{/* AUDIT TYPE SELECTION MODAL")
end_idx = content.find("      </AnimatePresence>", start_idx) + 24

audit_content = content[start_idx:end_idx]

early_return = """
  if (isAuditTypeModalOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 md:px-8 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsAuditTypeModalOpen(false)} className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[#1A1A18]">
              Stock Audit
            </h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full relative">
"""

inner_start = content.find('<div className="mb-8">', start_idx)
inner_end = content.find('               </div>', inner_start) + 21

early_return += content[inner_start:inner_end]

# For the audit type modal, there's also a bottom sticky bar.
footer_start = content.find('<div className="absolute bottom-0 left-0 right-0 border-t border-[#F0F1F4] bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">', inner_end)
if footer_start != -1 and footer_start < end_idx:
    footer_end = content.find('</div>', content.find('</button>', footer_start)) + 6
    # We will replace the absolute bottom with sticky bottom
    footer_html = content[footer_start:footer_end].replace('absolute bottom-0 left-0 right-0', 'sticky bottom-0 mt-auto')
    early_return += footer_html

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
    
print("Successfully refactored Audit")
