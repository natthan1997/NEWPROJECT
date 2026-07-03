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
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useI18n } from "@/lib/I18nContext";

interface POSModifierManagerProps {
  profile: any
  activeView: string
  allowedNav: any[]
  onSetView: (view: any) => void
  activeShift?: any
  onShiftModalOpen?: () => void
  setViewExtraHeader: (node: React.ReactNode) => void
  shopSettings?: any
}

const ModifierGroupItem = ({
  group,
  onReorderOptions,
}: {
  group: any
  onReorderOptions: (newOptions: any[]) => void
}) => {
  const controls = useDragControls()
  const { locale } = useI18n();

  return (
    <Reorder.Item
      value={group}
      dragListener={false}
      dragControls={controls}
      className="flex flex-col border-2 border-[#1A1A18] bg-white shadow-sm"
    >
      <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50 p-4">
        <div
          onPointerDown={e => controls.start(e)}
          className="cursor-grab p-1 active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <GripVertical size={20} className="text-gray-400" />
        </div>
        <h3 className="font-black uppercase tracking-tighter text-black">{group.name}</h3>
      </div>
      {group.options && group.options.length > 0 && (
        <div className="bg-white p-4">
          <Reorder.Group
            axis="y"
            values={group.options}
            onReorder={onReorderOptions}
            className="space-y-2"
          >
            {group.options.map((opt: any) => (
              <Reorder.Item
                key={opt.id}
                value={opt}
                className="group/item flex cursor-grab items-center gap-3 border border-gray-100 bg-white p-3 transition-all hover:border-[#1A1A18]/20 hover:shadow-sm active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              >
                <Menu size={14} className="text-gray-300 group-hover/item:text-black" />
                <span className="text-[12px] font-bold uppercase text-gray-600 transition-colors group-hover/item:text-black">
                  {opt.name}
                </span>
                {opt.price_adjustment > 0 && (
                  <span className="ml-auto text-[10px] font-black text-emerald-600">
                    {locale === 'en' ? '                     + ฿' : locale === 'zh' ? '                     + ฿' : '                     + ฿'}{opt.price_adjustment}
                  </span>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}
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

  // --- Bulk Edit / Table View ---
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name',
    'group_name',
    'price_adjustment',
    'is_active',
  ])
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [isSortMode, setIsSortMode] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  const handleReorderGroups = (newGroups: any[]) => {
    setGroups(newGroups)
  }

  const handleReorderOptions = (groupId: string, newOptions: any[]) => {
    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, options: newOptions } : g)))
  }

  // DEBOUNCED SAVE LOGIC
  useEffect(() => {
    if (!isSortMode) return

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
      }
    }

    const timer = setTimeout(saveOrder, 2000)
    return () => clearTimeout(timer)
  }, [groups, isSortMode])

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
            onClick={() => setIsSortMode(prev => !prev)}
            className={`flex h-10 items-center justify-center px-4 transition-all ${isSortMode ? 'bg-[#1A1A18] text-white shadow-lg' : 'font-bold text-gray-300 hover:text-black'} gap-2 text-[10px] font-black uppercase tracking-widest`}
          >
            <GripVertical size={14} /> {isSortMode ? 'Done Sorting' : 'Sort Mode'}
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex h-10 w-10 items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-[#1A1A18] text-white shadow-lg' : 'font-bold text-gray-300 hover:text-black'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex h-10 w-10 items-center justify-center transition-all ${viewMode === 'table' ? 'bg-[#1A1A18] text-white shadow-lg' : 'font-bold text-gray-300 hover:text-black'}`}
          >
            <List size={18} />
          </button>
        </div>
        <button
          onClick={() => openGroupEditor()}
          className="flex h-10 items-center justify-center gap-3 whitespace-nowrap bg-[#1A1A18] px-8 font-bold text-white shadow-xl transition-all hover:bg-black"
        >
          <Plus size={16} />{' '}
          <span className="text-[10px] font-black font-bold uppercase tracking-widest">
            {locale === 'en' ? '             เพิ่มกลุ่มตัวเลือก           ' : locale === 'zh' ? '             เพิ่มกลุ่มตัวเลือก           ' : '             เพิ่มกลุ่มตัวเลือก           '}</span>
        </button>
      </div>
    )
    return () => setViewExtraHeader(null)
  }, [setViewExtraHeader, searchTerm, viewMode, isSortMode])

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
                      {group.min_select === 0 ? 'ระบุหรือไม่ก็ได้' : `ต้องเลือกอย่างน้อย ${group.min_select}`}
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
                        <div className={`w-2 h-2 rounded-full shrink-0 ${opt.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
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
