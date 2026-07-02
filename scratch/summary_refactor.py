import re

file_path = "components/pos/POSInventoryManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

start_idx = content.find("{/* QUICK SUMMARY MODAL */}")
end_idx = content.find("      <AnimatePresence>", start_idx)

# Summary doesn't have animate presence in its wrapper? Oh wait, it is just:
# {isSummaryOpen && ( <div ...> ... </div> )}
# Let's find end_idx by looking for the next modal.
end_idx = content.find("{/* MOBILE SHEET", start_idx)
if end_idx == -1:
    end_idx = content.find("{/* MOBILE QUICK ACTIONS SHEET */}", start_idx)
if end_idx == -1:
    end_idx = content.find("{/* AUDIT TYPE SELECTION MODAL", start_idx)
if end_idx == -1:
    end_idx = content.find("{isMobileInventorySheetOpen", start_idx)

# actually let's just find the closing tag of isSummaryOpen
inner_start = content.find("<div className=\"flex-1 overflow-y-auto", start_idx)
inner_end = content.find("            </div>", inner_start) + 18
footer_start = content.find("<footer", inner_start)
if footer_start != -1 and footer_start < inner_end:
    inner_end = content.find("</footer>", footer_start) + 9

early_return = """
  if (isSummaryOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 md:px-8 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSummaryOpen(false)} className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[#1A1A18]">Inventory Quick Summary</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8C8A81] leading-none">{locale === 'en' ? 'สรุปจำนวนสินค้าแยกตามหมวดหมู่' : locale === 'zh' ? 'สรุปจำนวนสินค้าแยกตามหมวดหมู่' : 'สรุปจำนวนสินค้าแยกตามหมวดหมู่'}</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-12">
"""

early_return += content[inner_start:inner_end]

early_return += """
        </div>
      </div>
    );
  }
"""

# The closing braces for isSummaryOpen are right after inner_end.
# We will just remove from start_idx to the end of isSummaryOpen block.
# Which is 2 `</div>` and `)}` after inner_end
close_tags = content.find(")}", inner_end) + 2

insert_idx = content.find("return (", content.find("] as const"))

new_content = content[:insert_idx] + early_return + "\n  " + content[insert_idx:start_idx] + content[close_tags:]

with open(file_path, "w") as f:
    f.write(new_content)
    
print("Successfully refactored Summary")
