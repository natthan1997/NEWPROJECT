import re

file_path = "components/pos/POSInventoryManager.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Edit Modal
start_edit = content.find("{/* EDIT MODAL */}")
end_edit = content.find("{/* QUICK SUMMARY MODAL */}", start_edit)
edit_content = content[start_edit:end_edit]
inner_start = edit_content.find('<div className="grid grid-cols-2')
inner_end = edit_content.find("              <footer")
footer_start = edit_content.find("<footer")
footer_end = edit_content.find("</footer>") + 9

edit_view = """
  if (isEditorOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 md:px-8 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsEditorOpen(false)} className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[#1A1A18] leading-none">{editingItem.id ? 'Edit Material' : 'New Material'}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8C8A81] leading-none mt-2">Inventory Management Portal</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 font-bold">
""" + edit_content[inner_start:inner_end] + edit_content[footer_start:footer_end] + """
        </div>
      </div>
    );
  }
"""

# 2. Supplier Manager Modal
start_sup = content.find("{/* SUPPLIER MANAGER MODAL */}")
end_sup = content.find("{/* SHOPPING LIST MODAL */}", start_sup)
sup_content = content[start_sup:end_sup]
inner_start = sup_content.find("{/* Create New Supplier */}")
inner_end = sup_content.rfind("               </div>")

sup_view = """
  if (isSupplierManagerOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 md:px-8 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSupplierManagerOpen(false)} className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[#1A1A18] leading-none flex items-center gap-2">
                <Settings size={24} className="text-black" />
                {locale === 'en' ? 'Manage Suppliers' : locale === 'zh' ? 'Manage Suppliers' : 'จัดการแหล่งจัดซื้อ'}
              </h1>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
""" + sup_content[inner_start:inner_end] + """
        </div>
      </div>
    );
  }
"""

# 3. Shopping List Modal
start_shop = content.find("{/* SHOPPING LIST MODAL */}")
end_shop = content.find("      </AnimatePresence>", start_shop)
shop_content = content[start_shop:end_shop]
inner_start = shop_content.find("{(() => {")
inner_end = shop_content.find("})()}", inner_start) + 5

shop_view = """
  if (isShoppingListOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 md:px-8 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsShoppingListOpen(false)} className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[#1A1A18] leading-none flex items-center gap-2">
                <ShoppingCart size={24} className="text-amber-500" />
                {locale === 'en' ? 'Shopping List' : locale === 'zh' ? 'Shopping List' : 'สรุปรายการจัดซื้อ'}
              </h1>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
""" + shop_content[inner_start:inner_end] + """
        </div>
      </div>
    );
  }
"""

# 4. Quick Summary Modal
start_sum = content.find("{/* QUICK SUMMARY MODAL */}")
end_sum = content.find("{isMobileInventorySheetOpen", start_sum)
end_sum = content.rfind("<AnimatePresence>", start_sum, end_sum) # find the animate presence before mobile sheet
if end_sum == -1:
    end_sum = content.find("{/* MOBILE SHEET", start_sum)
sum_content = content[start_sum:end_sum]
inner_start = sum_content.find("{categories.map(category => {")
inner_end = sum_content.rfind("                </section>")
if inner_end != -1:
    inner_end = sum_content.find("              )}", inner_end) + 16

sum_view = """
  if (isSummaryOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 md:px-8 py-4 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSummaryOpen(false)} className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-600 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[#1A1A18] leading-none">Inventory Quick Summary</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8C8A81] leading-none mt-2">{locale === 'en' ? 'สรุปจำนวนสินค้าแยกตามหมวดหมู่' : locale === 'zh' ? 'สรุปจำนวนสินค้าแยกตามหมวดหมู่' : 'สรุปจำนวนสินค้าแยกตามหมวดหมู่'}</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-12">
""" + sum_content[inner_start:inner_end] + """
        </div>
      </div>
    );
  }
"""

# 5. Audit Type Selection
start_audit = content.find("{/* AUDIT TYPE SELECTION MODAL")
end_audit = content.find("      </AnimatePresence>", start_audit) + 24
if end_audit < start_audit + 24:
    end_audit = content.find("      </AnimatePresence>", start_audit) + 24
audit_content = content[start_audit:end_audit]
inner_start = audit_content.find('<div className="mb-8">')
inner_end = audit_content.find('               </div>', inner_start) + 21
footer_start = audit_content.find('<div className="absolute bottom-0')
footer_end = audit_content.find('</div>', audit_content.find('</button>', footer_start)) + 6
footer_html = audit_content[footer_start:footer_end].replace('absolute bottom-0 left-0 right-0', 'sticky bottom-0 mt-auto')

audit_view = """
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
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col relative">
""" + audit_content[inner_start:inner_end] + footer_html + """
        </div>
      </div>
    );
  }
"""

# 6. Mobile Action Menu
start_mobile = content.find("{isMobileInventorySheetOpen && (")
start_mobile = content.rfind("<AnimatePresence>", 0, start_mobile)
end_mobile = content.find("      </AnimatePresence>", start_mobile) + 24
mobile_content = content[start_mobile:end_mobile]
inner_start = mobile_content.find('<div className="space-y-0 border-y')
inner_end = mobile_content.find('              <div className="px-6 mt-6">')

mobile_view = """
  if (isMobileInventorySheetOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] z-50 fixed inset-0 sm:hidden">
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
""" + mobile_content[inner_start:inner_end] + """
        </div>
      </div>
    );
  }
"""

all_views = edit_view + sup_view + shop_view + sum_view + audit_view + mobile_view

# Delete original modals from bottom of the file
# The first modal is EDIT MODAL
delete_start = content.find("{/* EDIT MODAL */}")
delete_end = content.find("    </>", delete_start)
new_content = content[:delete_start] + content[delete_end:]

# Insert early returns before `return (` at line 611
insert_idx = new_content.find("return (", new_content.find("] as const"))
final_content = new_content[:insert_idx] + all_views + "\n  " + new_content[insert_idx:]

with open(file_path, "w") as f:
    f.write(final_content)
    
print("Successfully refactored ALL views")
