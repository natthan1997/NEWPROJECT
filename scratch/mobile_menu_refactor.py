import re

file_path = "components/pos/POSInventoryManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

start_idx = content.find("{/* MOBILE SHEET")
if start_idx == -1:
    start_idx = content.find("{isMobileInventorySheetOpen && (")
    # Actually we need to find the <AnimatePresence> before it.
    start_idx = content.rfind("<AnimatePresence>", 0, start_idx)

end_idx = content.find("      </AnimatePresence>", start_idx) + 24

early_return = """
  if (isMobileInventorySheetOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileInventorySheetOpen(false)} className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-black uppercase tracking-tighter text-[#1A1A18]">
              {locale === 'en' ? 'Menu' : locale === 'zh' ? 'Menu' : 'เมนูตัวเลือก'}
            </h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 w-full">
"""

inner_start = content.find('<div className="space-y-0 border-y', start_idx)
inner_end = content.find('              <div className="px-6 mt-6">', inner_start)

# The content includes two divs with space-y-0. We can just capture both.
# But wait, we modified this earlier!
# Let's just find the closing tag for the second block.
if inner_end == -1:
    inner_end = content.find('              </motion.div>', inner_start)

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
    
print("Successfully refactored Mobile Menu")
