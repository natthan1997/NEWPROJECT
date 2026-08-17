'use client';
import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Loader2,
  Check,
  X,
  Save,
  Settings,
  Layers,
  Menu,
  ChevronRight,
  List,
  LayoutGrid,
  Info,
  AlertTriangle,
  Star,
  GripVertical,
  SlidersHorizontal,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useI18n } from '@/lib/I18nContext'

function useLongPressReorder(isReordering: boolean) {
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

        const handleDown = (e: TouchEvent | MouseEvent) => {
            e.stopPropagation()
            if ('button' in e && (e as MouseEvent).button !== 0) return // only left click
            
            state.current.isLongPressed = false
            state.current.isDragging = false
            
            const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
            const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
            
            state.current.startX = clientX
            state.current.startY = clientY
            state.current.startEvent = e as any

            state.current.timer = setTimeout(() => {
                state.current.isLongPressed = true
                if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
                
                el.classList.remove('shadow-sm')
                el.classList.add('shadow-2xl', 'border-black/20', 'z-50')
                el.style.cursor = 'grabbing'
            }, 300)
        }

        const handleMove = (e: TouchEvent | MouseEvent) => {
            if (!state.current.isLongPressed) {
                const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
                const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
                const dx = Math.abs(clientX - state.current.startX)
                const dy = Math.abs(clientY - state.current.startY)
                if (dx > 10 || dy > 10) {
                    if (state.current.timer) clearTimeout(state.current.timer)
                }
                return
            }
            e.stopPropagation() 
            if (e.cancelable) e.preventDefault()
            
            if (!state.current.isDragging) {
                state.current.isDragging = true
                controls.start(state.current.startEvent || e as any)
            }
        }

        const handleUp = (e: Event) => {
            e.stopPropagation()
            if (state.current.timer) clearTimeout(state.current.timer)
            state.current.isLongPressed = false
            state.current.isDragging = false
            el.classList.remove('shadow-2xl', 'border-black/20', 'z-50')
            el.classList.add('shadow-sm')
            el.style.cursor = ''
        }

        el.addEventListener('touchstart', handleDown, { passive: false })
        el.addEventListener('touchmove', handleMove, { passive: false })
        el.addEventListener('touchend', handleUp)
        el.addEventListener('touchcancel', handleUp)
        
        el.addEventListener('mousedown', handleDown)
        el.addEventListener('mousemove', handleMove)
        el.addEventListener('mouseup', handleUp)
        el.addEventListener('mouseleave', handleUp)

        return () => {
            el.removeEventListener('touchstart', handleDown)
            el.removeEventListener('touchmove', handleMove)
            el.removeEventListener('touchend', handleUp)
            el.removeEventListener('touchcancel', handleUp)
            
            el.removeEventListener('mousedown', handleDown)
            el.removeEventListener('mousemove', handleMove)
            el.removeEventListener('mouseup', handleUp)
            el.removeEventListener('mouseleave', handleUp)
        }
    }, [controls, isReordering])

    return { controls, itemRef }
}

interface ModifierOption {
  profile: any
  activeView: string
  allowedNav: any[]
  onSetView: (view: any) => void
  activeShift?: any
  onShiftModalOpen?: () => void
  setViewExtraHeader: (node: React.ReactNode) => void
  shopSettings?: any
}

const ModifierOptionItem = ({ opt, onEditOption, onDragStateChange }: any) => {
  const { controls, itemRef } = useLongPressReorder(true)

  return (
    <Reorder.Item
        ref={itemRef}
        value={opt}
        dragListener={false}
        dragControls={controls}
        onDragStart={() => onDragStateChange?.(true)}
        onDragEnd={() => onDragStateChange?.(false)}
        onPointerDown={(e) => e.stopPropagation()}
        className="group/item flex flex-col bg-white border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors relative z-10 cursor-pointer"
        style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'pan-y' }}
    >
      <div className="p-3 flex items-center gap-3 min-w-0">
          <div className="w-2"></div>
          <span className="text-[13px] font-bold text-gray-700 flex-1 truncate">{opt.name}</span>
          {opt.price_adjustment > 0 && (
            <span className="text-[11px] font-black text-emerald-600 px-2 shrink-0">+ ฿{opt.price_adjustment}</span>
          )}
          <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onEditOption(opt); }} className="text-gray-400 hover:text-black p-1 transition-colors z-20">
             <Edit3 size={14} />
          </button>
      </div>
    </Reorder.Item>
  )
}

const ModifierGroupItem = ({
  group,
  onReorderOptions,
  onEditGroup,
  onEditOption,
  expandedGroup,
  setExpandedGroup,
  onDragStateChange
}: any) => {
  const isExpanded = expandedGroup === group.id
  const { locale } = useI18n()
  const { controls, itemRef } = useLongPressReorder(true)

  return (
    <Reorder.Item
        ref={itemRef}
        value={group}
        dragListener={false}
        dragControls={controls}
        onDragStart={() => onDragStateChange?.(true)}
        onDragEnd={() => onDragStateChange?.(false)}
        onPointerDown={(e) => e.stopPropagation()}
        className="bg-white border-b border-gray-200 last:border-b-0 relative z-10 cursor-pointer"
        style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'pan-y' }}
    >
      <div 
        onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
        className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group/groupitem"
      >
        <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-gray-800">{group.name}</span>
            <span className="text-[14px] text-gray-400 font-medium">({group.options?.length || 0})</span>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onEditGroup(); }} 
                className="text-[13px] text-black font-medium flex items-center gap-1 hover:underline"
            >
                <Edit3 size={14} /> แก้ไข
            </button>
            <ChevronRight size={20} className={"text-gray-300 transition-transform " + (isExpanded ? "rotate-90" : "")} />
        </div>
      </div>

      <AnimatePresence>
      {isExpanded && (
        <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
        >
          <div className="bg-gray-50/50 p-4 border-t border-gray-100 border-b border-gray-100">
            {group.options && group.options.length > 0 && (
                <Reorder.Group
                  axis="y"
                  values={group.options}
                  onReorder={onReorderOptions}
                  className="flex flex-col border border-gray-200 rounded-xl overflow-hidden mb-4 shadow-sm"
                >
                  {group.options.map((opt: any) => (
                    <ModifierOptionItem 
                       key={opt.id} 
                       opt={opt} 
                       onEditOption={onEditOption} 
                       onDragStateChange={onDragStateChange}
                    />
                  ))}
                </Reorder.Group>
            )}
            <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onEditOption(); }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-[13px] font-bold text-gray-500 hover:border-black hover:text-black hover:bg-white transition-all flex items-center justify-center gap-2"
            >
                <Plus size={16} /> เพิ่มตัวเลือกย่อย
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

export default function POSModifierManager({
  profile, activeView, allowedNav, onSetView, activeShift, onShiftModalOpen, setViewExtraHeader, shopSettings
}: POSModifierManagerProps) {
  const { locale } = useI18n();
  const [groups, setGroups] = useState<any[]>([])
  const [allOptions, setAllOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any>(null)

  const [isOptionEditorOpen, setIsOptionEditorOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<any>(null)

  const [isSaving, setIsSaving] = useState(false)

  const [allMenuItems, setAllMenuItems] = useState<any[]>([])
  const [groupLinks, setGroupLinks] = useState<string[]>([])
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  // --- Bulk Edit / Table View ---
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name',
    'group_name',
    'price_adjustment',
    'is_active',
  ])
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [hasOrderChanged, setHasOrderChanged] = useState(false)

  const handleReorderGroups = (newGroups: any[]) => {
    setGroups(newGroups)
    setHasOrderChanged(true)
  }

  const handleReorderOptions = (groupId: string, newOptions: any[]) => {
    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, options: newOptions } : g)))
    setHasOrderChanged(true)
  }

  // DEBOUNCED SAVE LOGIC
  useEffect(() => {
    if (!hasOrderChanged) return

    const saveOrder = async () => {
      setIsSavingOrder(true)
      try {
        // 1. Save Groups Order
        const groupUpdates = groups.map((g, idx) => ({ id: g.id, sort_order: idx + 1 }))
        for (const update of groupUpdates) {
          await supabase
            .from('pos_menu_modifier_groups')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id)
        }

        // 2. Save Options Order within each group
        for (const group of groups) {
          if (group.options) {
            const optionUpdates = group.options.map((o: any, idx: number) => ({
              id: o.id,
              sort_order: idx + 1,
            }))
            for (const update of optionUpdates) {
              await supabase
                .from('pos_menu_modifiers')
                .update({ sort_order: update.sort_order })
                .eq('id', update.id)
            }
          }
        }
      } catch (e) {
        console.error('Failed to save order:', e)
      } finally {
        setIsSavingOrder(false)
        setHasOrderChanged(false)
      }
    }

    const timer = setTimeout(saveOrder, 2000)
    return () => clearTimeout(timer)
  }, [groups, hasOrderChanged])

  const columns = [
    { id: 'name', label: 'ชื่อรายการย่อย' },
    { id: 'group_name', label: 'กลุ่มตัวเลือก' },
    { id: 'price_adjustment', label: 'ราคาเพิ่ม/ลด' },
    { id: 'sort_order', label: 'ลำดับ' },
    { id: 'is_active', label: 'เปิดใช้งาน' },
  ]

  useEffect(() => {
    if (shopSettings) {
      fetchData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopSettings?.branch_id])

  useEffect(() => {
    setViewExtraHeader(
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-1 border border-gray-100 bg-gray-50 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex h-10 w-10 items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-[#D3202B] text-white shadow-lg' : 'font-bold text-gray-300 hover:text-black'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex h-10 w-10 items-center justify-center transition-all ${viewMode === 'table' ? 'bg-[#D3202B] text-white shadow-lg' : 'font-bold text-gray-300 hover:text-black'}`}
          >
            <List size={18} />
          </button>
        </div>
        <button
          onClick={() => openGroupEditor()}
          className="flex h-10 items-center justify-center gap-3 whitespace-nowrap bg-[#D3202B] px-8 font-bold text-white shadow-xl transition-all hover:bg-red-700"
        >
          <Plus size={16} />{' '}
          <span className="text-[10px] font-black font-bold uppercase tracking-widest">
            {locale === 'en' ? '             เพิ่มกลุ่มตัวเลือก           ' : locale === 'zh' ? '             เพิ่มกลุ่มตัวเลือก           ' : '             เพิ่มกลุ่มตัวเลือก           '}</span>
        </button>
      </div>
    )
    return () => setViewExtraHeader(null)
  }, [setViewExtraHeader, searchTerm, viewMode, locale])

  const fetchData = async () => {
    setLoading(true)
    const branchId = shopSettings?.branch_id

    let query = supabase
      .from('pos_menu_modifier_groups')
      .select('*, options:pos_menu_modifiers(*)')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    } else {
      query = query.is('branch_id', null)
    }

    const { data: groupData } = await query

    // Fetch all menu items for linking
    const { data: itemData } = await supabase
      .from('pos_menu_items')
      .select('id, name')
      .order('name')
    if (itemData) setAllMenuItems(itemData)

    if (groupData) {
      setGroups(groupData)
      const flatOptions: any[] = []
      groupData.forEach((g: any) => {
        if (g.options) {
          // Sort options within group
          const sortedOptions = [...g.options].sort(
            (a: any, b: any) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
          )
          sortedOptions.forEach((o: any) => {
            flatOptions.push({ ...o, group_name: g.name })
          })
        }
      })
      setAllOptions(flatOptions)
    }
    setLoading(false)
  }

  const fetchGroupLinks = async (groupId: string) => {
    const { data } = await supabase
      .from('pos_item_modifier_links')
      .select('item_id')
      .eq('group_id', groupId)
    if (data) setGroupLinks(data.map(d => d.item_id))
    else setGroupLinks([])
  }

  const openGroupEditor = (group: any = null) => {
    setEditingGroup(
      group || { name: '', min_selection: 0, max_selection: 1, sort_order: 0, is_active: true }
    )
    if (group) fetchGroupLinks(group.id)
    else setGroupLinks([])
    setIsGroupEditorOpen(true)
  }

  const openOptionEditor = (group: any, option: any = null) => {
    setEditingOption(
      option || {
        group_id: group.id,
        name: '',
        price_adjustment: 0,
        sort_order: 0,
        is_active: true,
      }
    )
    setIsOptionEditorOpen(true)
  }

  const handleSaveGroup = async () => {
    setIsSaving(true)
    try {
      const { options, ...cleanGroup } = editingGroup

      // Ensure we use the correct column names for selection constraints
      const groupToSave = {
        ...cleanGroup,
        min_selection: cleanGroup.min_select ?? cleanGroup.min_selection ?? 0,
        max_selection: cleanGroup.max_select ?? cleanGroup.max_selection ?? 1,
        // Sync with the legacy columns if they exist
        min_select: cleanGroup.min_select ?? cleanGroup.min_selection ?? 0,
        max_select: cleanGroup.max_select ?? cleanGroup.max_selection ?? 1,
        branch_id: shopSettings?.branch_id || null
      }

      const { data: savedGroup, error } = await supabase
        .from('pos_menu_modifier_groups')
        .upsert(groupToSave)
        .select()
        .single()

      if (!error && savedGroup) {
        const groupId = savedGroup.id

        // Sync links
        await supabase.from('pos_item_modifier_links').delete().eq('group_id', groupId)
        if (groupLinks.length > 0) {
          const links = groupLinks.map(itemId => ({ group_id: groupId, item_id: itemId }))
          await supabase.from('pos_item_modifier_links').insert(links)
        }

        setIsGroupEditorOpen(false)
        fetchData()
      } else {
        alert('Error: ' + error?.message)
      }
    } catch (e) {
      console.error(e)
    }
    setIsSaving(false)
  }

  const handleSaveOption = async () => {
    setIsSaving(true)
    const { group_name, ...optionToSave } = editingOption
    const { error } = await supabase.from('pos_menu_modifiers').upsert(optionToSave)
    if (!error) {
      setIsOptionEditorOpen(false)
      fetchData()
    } else {
      alert('Error: ' + error.message)
    }
    setIsSaving(false)
  }

  const handleBulkUpdate = async (id: string, field: string, value: any) => {
    const { error } = await supabase
      .from('pos_menu_modifiers')
      .update({ [field]: value })
      .eq('id', id)
    if (!error) {
      setAllOptions(prev => prev.map(opt => (opt.id === id ? { ...opt, [field]: value } : opt)))
      // Still need to update groups state too if we want grid to sync
      fetchData()
    }
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('ยืนยันการลบกลุ่มนี้? รายการย่อยทั้งหมดจะถูกลบไปด้วย')) return
    await supabase.from('pos_menu_modifier_groups').delete().eq('id', id)
    fetchData()
  }

  const handleDeleteOption = async (id: string) => {
    if (!confirm('ยืนยันการลบรายการย่อยนี้?')) return
    await supabase.from('pos_menu_modifiers').delete().eq('id', id)
    fetchData()
  }

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredOptions = allOptions.filter(
    o =>
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.group_name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  return (
    <div className="w-full pb-10">
      {isSavingOrder && (
          <div className="p-4 bg-gray-50 flex items-center justify-between sticky top-0 z-20 border-b border-gray-200">
              <span className="text-[13px] font-medium text-gray-600">กำลังบันทึกลำดับ...</span>
              <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={32} className="animate-spin mb-4" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
            <SlidersHorizontal size={28} />
          </div>
          <p className="text-sm text-gray-500 font-medium">ยังไม่มีกลุ่มตัวเลือก</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border-b border-gray-100 pb-20">
          <div className="p-4 mb-2 text-center bg-gray-50 border-b border-gray-100">
            <span className="text-[13px] font-medium text-gray-500">กดค้างที่รายการย่อยเพื่อลากสลับตำแหน่ง</span>
          </div>
          <Reorder.Group
            axis="y"
            values={groups}
            onReorder={handleReorderGroups}
            className="flex flex-col w-full"
          >
            {groups.map((group: any) => (
              <ModifierGroupItem
                key={group.id}
                group={group}
                onReorderOptions={(newOptions: any[]) => handleReorderOptions(group.id, newOptions)}
                onEditGroup={() => openGroupEditor(group)}
                onEditOption={(opt: any) => opt ? openOptionEditor(group, opt) : openOptionEditor(group)}
                expandedGroup={expandedGroup}
                setExpandedGroup={setExpandedGroup}
              />
            ))}
          </Reorder.Group>
        </div>
      )}

      <div className="p-4 mt-2">
          <button onClick={() => openGroupEditor()} className="w-full bg-black hover:bg-gray-800 text-white py-3.5 rounded-[12px] font-semibold transition-colors flex items-center justify-center gap-2 text-[15px]">
              <Plus size={18} /> เพิ่มกลุ่มตัวเลือก
          </button>
      </div>

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
                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                      >
                        <span className={`text-[13px] font-black ${isActive ? 'text-emerald-900' : 'text-gray-700'}`}>
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
                className="flex-1 h-14 rounded-full bg-[#D3202B] text-white font-black tracking-wide hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10"
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
                className="flex-1 h-14 rounded-full bg-[#D3202B] text-white font-black tracking-wide hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10"
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
