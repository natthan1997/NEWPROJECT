'use client';
import React, { useState, useEffect } from 'react'
import { Tag, Plus, Trash2, Save, X, GripVertical, Loader2, Edit3, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useI18n } from '@/lib/I18nContext'

interface Category {
  id: string
  name: string
  color?: string
  icon?: string
  order_index?: number
  branch_id?: string | null
  item_count?: number
  estimated_prep_minutes?: number
}

interface POSCategoryManagerProps {
  shopSettings?: any
  onCategoriesChange?: (categories: Category[]) => void
}

const CategoryItem = ({ cat, openEdit, isReordering }: { cat: Category, openEdit: (cat: Category) => void, isReordering: boolean }) => {
  const controls = useDragControls()
  const itemRef = React.useRef<any>(null)

  const state = React.useRef({
      timer: null as NodeJS.Timeout | null,
      isLongPressed: false,
      isDragging: false,
      startX: 0,
      startY: 0,
      startEvent: null as TouchEvent | null
  })

  React.useEffect(() => {
      if (!isReordering) return
      const el = itemRef.current
      if (!el) return

      const handleTouchStart = (e: TouchEvent) => {
          state.current.isLongPressed = false
          state.current.isDragging = false
          state.current.startX = e.touches[0].clientX
          state.current.startY = e.touches[0].clientY
          state.current.startEvent = e

          state.current.timer = setTimeout(() => {
              state.current.isLongPressed = true
              if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
              
              el.classList.remove('shadow-sm')
              el.classList.add('shadow-2xl', 'border-black/20', 'z-50')
          }, 300)
      }

      const handleTouchMove = (e: TouchEvent) => {
          if (!state.current.isLongPressed) {
              const dx = Math.abs(e.touches[0].clientX - state.current.startX)
              const dy = Math.abs(e.touches[0].clientY - state.current.startY)
              if (dx > 10 || dy > 10) {
                  if (state.current.timer) clearTimeout(state.current.timer)
              }
              return
          }
          if (e.cancelable) e.preventDefault()
          if (!state.current.isDragging) {
              state.current.isDragging = true
              controls.start(state.current.startEvent as any || e as any)
          }
      }

      const handleTouchEnd = () => {
          if (state.current.timer) clearTimeout(state.current.timer)
          state.current.isLongPressed = false
          state.current.isDragging = false
          el.classList.remove('shadow-2xl', 'border-black/20', 'z-50')
          el.classList.add('shadow-sm')
      }

      el.addEventListener('touchstart', handleTouchStart, { passive: false })
      el.addEventListener('touchmove', handleTouchMove, { passive: false })
      el.addEventListener('touchend', handleTouchEnd)
      el.addEventListener('touchcancel', handleTouchEnd)

      return () => {
          el.removeEventListener('touchstart', handleTouchStart)
          el.removeEventListener('touchmove', handleTouchMove)
          el.removeEventListener('touchend', handleTouchEnd)
          el.removeEventListener('touchcancel', handleTouchEnd)
      }
  }, [controls, isReordering])

  if (isReordering) {
    return (
      <Reorder.Item
        ref={itemRef}
        value={cat}
        dragListener={false}
        dragControls={controls}
        onMouseDown={(e) => controls.start(e)}
        className="p-4 flex items-center gap-3 bg-white transition-shadow border border-gray-100 rounded-[12px] shadow-sm mb-3 cursor-grab active:cursor-grabbing relative z-10"
        style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'pan-y' }}
      >
        <GripVertical size={20} className="text-gray-400" />
        <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-[15px] font-bold text-gray-800 uppercase tracking-wide truncate">{cat.name}</span>
            <span className="text-[14px] text-gray-400 font-medium whitespace-nowrap">({cat.item_count || 0})</span>
        </div>
      </Reorder.Item>
    )
  }

  return (
    <div className="p-4 flex items-center gap-3 bg-white hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => openEdit(cat)}>
      <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 truncate pr-4">
              <span className="text-[15px] font-bold text-gray-800 uppercase tracking-wide truncate">{cat.name}</span>
              <span className="text-[14px] text-gray-400 font-medium whitespace-nowrap">({cat.item_count || 0})</span>
          </div>
          <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
      </div>
    </div>
  )
}

export default function POSCategoryManager({ shopSettings, onCategoriesChange }: POSCategoryManagerProps) {
  const { locale } = useI18n()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [hasOrderChanges, setHasOrderChanges] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formPrepMinutes, setFormPrepMinutes] = useState(2)

  const branchId = shopSettings?.branch_id || null

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchCategories = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('pos_menu_categories')
        .select('*, pos_menu_items(count)')
        .order('order_index')

      if (branchId) {
        query = query.eq('branch_id', branchId)
      } else {
        query = query.is('branch_id', null)
      }

      const { data, error } = await query
      if (error) throw error

      // Get item counts per category
      const cats = (data || []).map((c: any) => ({
        ...c,
        item_count: c.pos_menu_items?.[0]?.count || 0
      }))

      // Also fetch actual item counts
      const catIds = cats.map((c: any) => c.id)
      if (catIds.length > 0) {
        let countQuery = supabase
          .from('pos_menu_items')
          .select('category_id')
          .in('category_id', catIds)
          .eq('is_active', true)

        if (branchId) countQuery = countQuery.eq('branch_id', branchId)
        else countQuery = countQuery.is('branch_id', null)

        const { data: itemData } = await countQuery
        const countMap: Record<string, number> = {}
        itemData?.forEach((i: any) => {
          countMap[i.category_id] = (countMap[i.category_id] || 0) + 1
        })
        cats.forEach((c: any) => { c.item_count = countMap[c.id] || 0 })
      }

      setCategories(cats)
      setHasOrderChanges(false)
      onCategoriesChange?.(cats)
    } catch (e: any) {
      showToast(e.message || 'โหลดหมวดหมู่ไม่สำเร็จ', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [shopSettings?.branch_id])

  const openAdd = () => {
    setFormName('')
    setFormPrepMinutes(2)
    setEditingCat(null)
    setIsAddOpen(true)
  }

  const openEdit = (cat: Category) => {
    setFormName(cat.name)
    setFormPrepMinutes(cat.estimated_prep_minutes ?? 2)
    setEditingCat(cat)
    setIsAddOpen(true)
  }

  const closeAdd = () => setIsAddOpen(false)

  const handleSave = async () => {
    if (!formName.trim()) return showToast('กรุณาใส่ชื่อหมวดหมู่', 'error')
    setSaving(true)
    try {
      const payload: any = {
        name: formName.trim(),
        branch_id: branchId,
        estimated_prep_minutes: formPrepMinutes,
      }

      if (editingCat) {
        // Update
        const { error } = await supabase
          .from('pos_menu_categories')
          .update(payload)
          .eq('id', editingCat.id)
        if (error) throw error
        showToast('อัปเดตหมวดหมู่สำเร็จ')
      } else {
        // Insert
        payload.order_index = categories.length
        const { error } = await supabase
          .from('pos_menu_categories')
          .insert(payload)
        if (error) throw error
        showToast('เพิ่มหมวดหมู่สำเร็จ')
      }

      setIsAddOpen(false)
      await fetchCategories()
    } catch (e: any) {
      showToast(e.message || 'บันทึกไม่สำเร็จ', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (cat.item_count && cat.item_count > 0) {
      return showToast(`ไม่สามารถลบได้ — ยังมีสินค้า ${cat.item_count} รายการในหมวดนี้ กรุณาย้ายสินค้าออกก่อน`, 'error')
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('pos_menu_categories')
        .delete()
        .eq('id', cat.id)
      if (error) throw error
      showToast('ลบหมวดหมู่สำเร็จ')
      setDeleteConfirmId(null)
      await fetchCategories()
    } catch (e: any) {
      showToast(e.message || 'ลบไม่สำเร็จ', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryReorder = (nextCategories: Category[]) => {
    const updatedCats = nextCategories.map((c, i) => ({ ...c, order_index: i }))
    setCategories(updatedCats)
    setHasOrderChanges(true)
  }

  const handleSaveOrder = async () => {
    setSaving(true)
    try {
      await Promise.all(
        categories.map((c, index) =>
          supabase.from('pos_menu_categories').update({ order_index: index }).eq('id', c.id)
        )
      )
      const normalized = categories.map((c, index) => ({ ...c, order_index: index }))
      setCategories(normalized)
      setHasOrderChanges(false)
      setIsReordering(false)
      onCategoriesChange?.(normalized)
      showToast('บันทึกลำดับหมวดหมู่สำเร็จ')
    } catch (e: any) {
      showToast(e.message || 'บันทึกลำดับไม่สำเร็จ', 'error')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="w-full pb-10">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl ${
              toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-black text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-[13px] font-bold tracking-wide">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {hasOrderChanges && (
          <div className="p-4 bg-gray-50 flex items-center justify-between sticky top-0 z-20 border-b border-gray-200">
              <span className="text-[13px] font-medium text-gray-600">พบการเปลี่ยนแปลงลำดับ</span>
              <button
                onClick={handleSaveOrder}
                disabled={saving}
                className="h-9 px-4 rounded-[10px] bg-black text-white flex items-center justify-center gap-2 shadow-sm font-bold text-[12px] hover:bg-gray-800 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                บันทึกลำดับ
              </button>
          </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={32} className="animate-spin mb-4" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
            <span className="text-[14px] text-gray-500 font-medium">ยังไม่มีหมวดหมู่</span>
        </div>
      ) : isReordering ? (
        <div className="px-4">
          <div className="p-4 mb-4 text-center">
            <span className="text-[13px] font-medium text-gray-500">กดค้างเพื่อลากสลับตำแหน่ง</span>
          </div>
          <Reorder.Group axis="y" values={categories} onReorder={handleCategoryReorder} className="flex flex-col">
            {categories.map((cat) => (
              <CategoryItem key={cat.id} cat={cat} openEdit={openEdit} isReordering={true} />
            ))}
          </Reorder.Group>
        </div>
      ) : (
        <div className="flex flex-col bg-white rounded-[20px] overflow-hidden shadow-sm border border-gray-100">
          {categories.map((cat, i) => (
            <React.Fragment key={cat.id}>
              {i > 0 && <div className="h-[1px] bg-gray-100 w-full" />}
              <CategoryItem cat={cat} openEdit={openEdit} isReordering={false} />
            </React.Fragment>
          ))}
        </div>
      )}

      {!isReordering && (
        <div className="p-4 mt-2 grid grid-cols-2 gap-3">
            <button onClick={() => setIsReordering(true)} className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-black py-3.5 rounded-[12px] font-semibold transition-colors flex items-center justify-center gap-2 text-[15px]">
                จัดเรียง
            </button>
            <button onClick={openAdd} className="w-full bg-black hover:bg-gray-800 text-white py-3.5 rounded-[12px] font-semibold transition-colors flex items-center justify-center gap-2 text-[15px]">
                <Plus size={18} /> เพิ่มหมวดหมู่
            </button>
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 font-noto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAdd}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">
                  {editingCat ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                </h3>
                <button
                  onClick={closeAdd}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[60vh] space-y-5">
                <div className="space-y-2.5 font-bold">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50">ชื่อหมวดหมู่</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white border border-[#E5E5DF] py-3.5 px-5 text-sm outline-none font-bold text-black"
                    placeholder="เช่น อาหารคาว, เครื่องดื่ม..."
                    autoFocus
                  />
                </div>
                <div className="space-y-2.5 font-bold">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50">เวลาที่ใช้ทำโดยประมาณ (นาที)</label>
                  <input
                    type="number"
                    min={0}
                    value={formPrepMinutes}
                    onChange={(e) => setFormPrepMinutes(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-[#E5E5DF] py-3.5 px-5 text-sm outline-none font-bold text-black"
                  />
                </div>
              </div>

              <div className="p-5 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !formName.trim()}
                  className="w-full h-12 rounded-[12px] bg-black text-white flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  บันทึก
                </button>
                {editingCat && (
                  <button
                    onClick={() => setDeleteConfirmId(editingCat.id)}
                    disabled={saving}
                    className="w-full h-12 rounded-[12px] bg-white border border-gray-200 text-rose-500 flex items-center justify-center gap-2 font-bold transition-all hover:bg-rose-50 hover:border-rose-200"
                  >
                    <Trash2 size={18} />
                    ลบหมวดหมู่นี้
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4 font-noto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">ยืนยันการลบ?</h3>
              <p className="text-sm font-medium text-gray-500 mb-6">
                คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้? รายการเมนูทั้งหมดในหมวดหมู่นี้จะถูกเปลี่ยนเป็น "ไม่มีหมวดหมู่"
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={saving}
                  className="w-full h-12 rounded-[12px] bg-rose-500 text-white font-bold transition-all hover:bg-rose-600 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'ยืนยันการลบ'}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={saving}
                  className="w-full h-12 rounded-[12px] bg-gray-100 text-gray-700 font-bold transition-all hover:bg-gray-200"
                >
                  ยกเลิก
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
