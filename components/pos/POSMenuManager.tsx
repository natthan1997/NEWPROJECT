'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { 
  Plus, Search, Edit3, Trash2, Filter, 
  MoreVertical, Check, X, Loader2, Image as ImageIcon,
  ChevronRight, RefreshCcw, Save, Trash, LayoutGrid,
  Menu as MenuIcon, LogOut, Settings, List, Star, ToggleRight, CheckCircle2, XCircle, Upload, AlertCircle, Crop, ZoomIn, ZoomOut
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useI18n } from "@/lib/I18nContext";
import { getMenuSearchText, getPrimaryMenuName, getSecondaryMenuName } from '@/lib/posMenuLabels'
import { sortMenuItemsByOrder, withMenuSortOrder } from '@/lib/posMenuOrder'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/lib/cropImage'

interface POSMenuManagerProps {
  profile: any
  activeView: string
  allowedNav: any[]
  onSetView: (view: any) => void
  onShiftModalOpen?: () => void
  activeShift?: any
  setViewExtraHeader: (node: React.ReactNode) => void
  shopSettings?: any
  forceViewMode?: "grid" | "table" | "stock"
  hideStockToggle?: boolean
}

export default function POSMenuManager({ 
  profile, activeView, allowedNav, onSetView, onShiftModalOpen, activeShift, setViewExtraHeader, shopSettings, forceViewMode, hideStockToggle
}: POSMenuManagerProps) {
  const { locale } = useI18n();
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropAspect, setCropAspect] = useState<number>(1)
  const [mediaSize, setMediaSize] = useState<{width: number, height: number} | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isCropping, setIsCropping] = useState(false)

  const userLevel = profile?.staff_level || 'staff'
  const userRole = profile?.role === 'admin' ? 'admin' : userLevel === 'manager' ? 'manager' : 'staff'
  const rolePerms = shopSettings?.role_permissions?.[userRole]
  const canEditMenu = profile?.role === 'admin' || !rolePerms || rolePerms.includes('menu-edit-price') || userRole === 'manager'

  const [allModifierGroups, setAllModifierGroups] = useState<any[]>([])
  const [itemModifierLinks, setItemModifierLinks] = useState<string[]>([])

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  // --- Bulk Edit / Table View ---
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'stock'>(forceViewMode || 'grid')
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['image_url', 'name', 'category_id', 'sale_price', 'cost_price', 'is_recommended'])
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [dirtyCategoryKeys, setDirtyCategoryKeys] = useState<string[]>([])
  const [reorderDraft, setReorderDraft] = useState<Record<string, string[]>>({})
  const [stockDraft, setStockDraft] = useState<Record<string, boolean>>({})
  const reorderSnapshotRef = useRef<any[] | null>(null)
  const itemsRef = useRef<any[]>([])

  const columns = [
    { id: 'image_url', label: 'รูปภาพ' },
    { id: 'name', label: 'ชื่อเมนู' },
    { id: 'category_id', label: 'หมวดหมู่' },
    { id: 'sale_price', label: 'ราคาขาย' },
    { id: 'cost_price', label: 'ราคาต้นทุน' },
    { id: 'is_recommended', label: 'เมนูแนะนำ' },
    { id: 'is_popular', label: 'ยอดนิยม' },
    { id: 'is_online_available', label: 'สั่งผ่าน QR' },
    { id: 'is_delivery_available', label: 'Delivery' },
    { id: 'status', label: 'สถานะ' },
  ]

  const getItemOrderKey = (item: any) => item.category_id || 'uncategorized'

  const sortMenuItems = (list: any[]) => sortMenuItemsByOrder(list)

  useEffect(() => {
    if (forceViewMode) setViewMode(forceViewMode)
  }, [forceViewMode])

  const categorySections = useMemo(() => {
    const uncategorizedSection = { id: 'uncategorized', name: 'อื่นๆ (Uncategorized)' }
    return [...categories, uncategorizedSection]
  }, [categories])

  const itemMap = useMemo(() => {
    const nextMap = new Map<string, any>()
    items.forEach(item => nextMap.set(item.id, item))
    return nextMap
  }, [items])

  const buildReorderDraft = useCallback((sourceItems: any[]) => {
    const draft: Record<string, string[]> = {}
    categorySections.forEach(cat => {
      draft[cat.id] = sortMenuItems(
        sourceItems.filter(item =>
          cat.id === 'uncategorized'
            ? !item.category_id || !categories.find(c => c.id === item.category_id)
            : item.category_id === cat.id
        )
      ).map(item => item.id)
    })
    return draft
  }, [categories, categorySections])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (shopSettings) {
      fetchData()
    }
  }, [shopSettings?.branch_id])

  const handleCancelReorder = useCallback(() => {
    if (reorderSnapshotRef.current) {
      setItems(reorderSnapshotRef.current.map(item => ({ ...item })))
    }
    setReorderDraft({})
    setDirtyCategoryKeys([])
    setReorderMode(false)
  }, [])

  const handleStartReorder = useCallback(() => {
    const snapshot = itemsRef.current.map(item => ({ ...item }))
    reorderSnapshotRef.current = snapshot
    setReorderDraft(buildReorderDraft(snapshot))
    setViewMode('table')
    setDirtyCategoryKeys([])
    setReorderMode(true)
  }, [buildReorderDraft])

  const handleSaveReorder = useCallback(async () => {
    setIsSaving(true)
    try {
      const currentItems = itemsRef.current
      const nextItems = currentItems.map(item => ({ ...item }))
      const nextItemMap = new Map(nextItems.map(item => [item.id, item]))
      const updates = dirtyCategoryKeys.flatMap(categoryKey =>
        (reorderDraft[categoryKey] || []).map((itemId, index) => {
          const targetItem = nextItemMap.get(itemId)
          const nextPlatformPrices = withMenuSortOrder(targetItem?.platform_prices, index)
          if (targetItem) {
            targetItem.sort_order = index
            targetItem.platform_prices = nextPlatformPrices
          }
          return supabase.from('pos_menu_items').update({ platform_prices: nextPlatformPrices }).eq('id', itemId)
        })
      )

      await Promise.all(updates)
      setItems(sortMenuItems(nextItems))
      reorderSnapshotRef.current = null
      setReorderDraft({})
      setDirtyCategoryKeys([])
      setReorderMode(false)
    } finally {
      setIsSaving(false)
    }
  }, [dirtyCategoryKeys, reorderDraft])

  useEffect(() => {
    setViewExtraHeader(
      <div className="flex flex-wrap items-center justify-between w-full gap-3 py-1">
          {/* View Modes */}
          <div className="flex items-center gap-2">
              {forceViewMode !== 'stock' && (
              <div className="flex items-center p-1 bg-gray-100/80 rounded-full border border-gray-200/50">
                   <button 
                       onClick={() => setViewMode('grid')} 
                       className={`w-10 h-8 rounded-full flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white text-[#1A1A18] shadow-sm font-bold' : 'text-gray-500 hover:text-black'}`}
                       title="Grid View"
                   >
                       <LayoutGrid size={16} />
                   </button>
                   <button 
                       onClick={() => setViewMode('table')} 
                       className={`w-10 h-8 rounded-full flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-white text-[#1A1A18] shadow-sm font-bold' : 'text-gray-500 hover:text-black'}`}
                       title="List View"
                   >
                       <List size={16} />
                   </button>
               </div>
              )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 ml-auto">
              {!hideStockToggle && forceViewMode !== 'stock' && (
                  <button 
                      onClick={() => setViewMode(viewMode === 'stock' ? 'grid' : 'stock')} 
                      className={`h-10 px-5 rounded-full flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] ${viewMode === 'stock' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                  >
                      <ToggleRight size={16} />
                      <span className="hidden sm:inline">{viewMode === 'stock' ? 'ปิดโหมดสต็อก' : 'อัปเดตสต็อก'}</span>
                  </button>
              )}
              
              <button
                  onClick={reorderMode ? handleCancelReorder : handleStartReorder}
                  className={`h-10 px-5 rounded-full flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] border ${
                      reorderMode
                        ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
              >
                  {reorderMode ? <X size={14} /> : <MenuIcon size={14} />}
                  <span className="hidden sm:inline">{reorderMode ? 'ยกเลิก' : 'จัดลำดับ'}</span>
              </button>

              {reorderMode && dirtyCategoryKeys.length > 0 && (
                <button
                    onClick={handleSaveReorder}
                    className="h-10 px-6 rounded-full bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all active:scale-95"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span className="hidden sm:inline">บันทึกลำดับ</span>
                </button>
              )}
              
              {canEditMenu && (
                <button 
                    onClick={() => { setEditingItem({ name: '', name_en: '', name_zh: '', sale_price: 0, status: 'active', category_id: categories[0]?.id }); setIsEditorOpen(true); }} 
                    className="h-10 px-6 rounded-full bg-[#1A1A18] text-white flex items-center justify-center gap-2 shadow-md shadow-black/10 font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all active:scale-95"
                >
                    <Plus size={16} /> 
                    <span className="hidden sm:inline">{locale === 'en' ? 'Add Menu' : locale === 'zh' ? 'เพิ่มรายการเมนู' : 'เพิ่มเมนู'}</span>
                </button>
              )}
          </div>
      </div>
    );
    return () => setViewExtraHeader(null);
  }, [setViewExtraHeader, viewMode, categories, reorderMode, dirtyCategoryKeys.length, isSaving, handleCancelReorder, handleStartReorder, handleSaveReorder]);
  const fetchData = async () => {
    setLoading(true)
    const branchId = shopSettings?.branch_id
    
    let catQuery = supabase.from('pos_menu_categories').select('*').order('order_index')
    let itemQuery = supabase.from('pos_menu_items').select('*, category:pos_menu_categories(name), modifiers:pos_item_modifier_links(group_id)').eq('is_active', true).order('name')
    let groupQuery = supabase.from('pos_menu_modifier_groups').select('*').order('name')

    if (branchId) {
      catQuery = catQuery.eq('branch_id', branchId)
      itemQuery = itemQuery.eq('branch_id', branchId)
      groupQuery = groupQuery.eq('branch_id', branchId)
    } else {
      catQuery = catQuery.is('branch_id', null)
      itemQuery = itemQuery.is('branch_id', null)
      groupQuery = groupQuery.is('branch_id', null)
    }

    const [catData, itemData, groupData] = await Promise.all([
      catQuery,
      itemQuery,
      groupQuery
    ])
    
    // Fetch inventory for dynamic cost calculation
    const { data: inventory } = await supabase.from('inventory_items').select('id, cost_price')
    
    if (catData.data) setCategories(catData.data)
    
    if (itemData.data) {
        if (inventory) {
            const invCostMap = new Map(inventory.map(i => [i.id, i.cost_price || 0]))
            const calculateRecipeCost = (recipe: any[]) => {
                return (recipe || []).reduce((sum, ing) => {
                    const cost = invCostMap.get(ing.ingredient_id) || 0
                    return sum + (cost * Number(ing.quantity || 0) * (ing.factor || 1))
                }, 0)
            }
            
            itemData.data.forEach(item => {
                const dynamicCost = calculateRecipeCost(item.recipe_data || [])
                if (dynamicCost > 0) {
                    item.cost_price = dynamicCost
                }
            })
        }
        setItems(sortMenuItems(itemData.data))
    }
    
    if (groupData.data) setAllModifierGroups(groupData.data)
    setLoading(false)
  }

  const fetchItemLinks = async (itemId: string) => {
    const { data } = await supabase.from('pos_item_modifier_links').select('group_id').eq('item_id', itemId)
    if (data) setItemModifierLinks(data.map(d => d.group_id))
    else setItemModifierLinks([])
  }

  const handleSaveItem = async () => {
      setIsSaving(true)
      const { category, modifiers, ...cleanItem } = editingItem
      const { updated_at, ...finalItem } = cleanItem as any

      if (!finalItem.branch_id && shopSettings?.branch_id) {
          finalItem.branch_id = shopSettings.branch_id
      }

      if (!editingItem?.id) {
          const siblingCount = items.filter(item => getItemOrderKey(item) === getItemOrderKey(finalItem)).length
          finalItem.platform_prices = withMenuSortOrder(finalItem.platform_prices, siblingCount)
      }

      const { data: savedItem, error } = await supabase.from('pos_menu_items').upsert(finalItem).select().single()
      
      if (!error && savedItem) {
          // Sync Modifiers
          const itemId = savedItem.id;
          
          // Delete old links
          await supabase.from('pos_item_modifier_links').delete().eq('item_id', itemId);
          
          // Insert new links
          if (itemModifierLinks.length > 0) {
              const links = itemModifierLinks.map(groupId => ({ item_id: itemId, group_id: groupId }));
              await supabase.from('pos_item_modifier_links').insert(links);
          }

          setIsEditorOpen(false)
          fetchData()
      } else {
          console.error('Save failed:', error)
          alert('ไม่สามารถบันทึกข้อมูลได้: ' + (error?.message || 'Unknown error'))
      }
      setIsSaving(false)
  }

  
  const handleSaveStockDraft = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(stockDraft).map(([id, inStock]) => ({
        id,
        in_stock: inStock
      }));
      
      for (const update of updates) {
        await supabase.from('pos_menu_items').update({ in_stock: update.in_stock }).eq('id', update.id);
      }
      
      setItems(items.map(item => {
        if (stockDraft[item.id] !== undefined) {
          return { ...item, in_stock: stockDraft[item.id] };
        }
        return item;
      }));
      setStockDraft({});
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  const handleStockDraftToggle = (id: string, currentStatus: boolean) => {
    setStockDraft(prev => {
      const next = { ...prev };
      // If toggled back to original state, remove from draft
      const originalItem = items.find(i => i.id === id);
      const originalStatus = originalItem?.in_stock !== false;
      const newStatus = !currentStatus;
      
      if (newStatus === originalStatus) {
        delete next[id];
      } else {
        next[id] = newStatus;
      }
      return next;
    });
  }

const handleBulkUpdate = async (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
    const { error } = await supabase.from('pos_menu_items').update({ [field]: value }).eq('id', id)
    if (error) {
        fetchData()
    }
   }

  const handleModifierGroupToggle = async (itemId: string, groupId: string) => {
    const currentItem = items.find(item => item.id === itemId)
    const currentGroupIds = (currentItem?.modifiers || []).map((modifier: any) => modifier.group_id)
    const nextGroupIds = currentGroupIds.includes(groupId)
      ? currentGroupIds.filter((id: string) => id !== groupId)
      : [...currentGroupIds, groupId]

    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, modifiers: nextGroupIds.map(id => ({ group_id: id })) }
        : item
    ))

    await supabase.from('pos_item_modifier_links').delete().eq('item_id', itemId)
    if (nextGroupIds.length > 0) {
      await supabase.from('pos_item_modifier_links').insert(
        nextGroupIds.map(id => ({ item_id: itemId, group_id: id }))
      )
    }
  }

  const handleInlineImageUpload = async (itemId: string, file?: File) => {
    if (!file) return

    setIsSaving(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `pos-menus/${fileName}`

      const { data: { session } } = await supabase.auth.getSession()
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'marketplace-images')
      formData.append('path', filePath)

      const uploadRes = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: formData
      })

      const uploadResult = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadResult.error || 'Failed to upload file')

      await handleBulkUpdate(itemId, 'image_url', uploadResult.publicUrl)
    } catch (error: any) {
      alert('Error uploading image: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      const objectUrl = URL.createObjectURL(file)
      setCropImageSrc(objectUrl)
      setIsCropping(true)
      setCropAspect(1) // Default back to square
      e.target.value = ''
  }


  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return

    setIsSaving(true)
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels)
      if (!croppedBlob) throw new Error('Failed to crop image')

      let uuid = Math.random().toString(36).substring(2, 15)
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

      let shouldUploadOriginal = true;
      let originalBlobToUpload: Blob | null = null;

      if (cropImageSrc.startsWith('http')) {
         const match = cropImageSrc.match(/\/pos-menus\/([a-zA-Z0-9]+)_(original|cropped)\./)
         if (match) {
            shouldUploadOriginal = false;
            uuid = match[1];
         } else {
            try {
               const originalRes = await fetch(cropImageSrc)
               originalBlobToUpload = await originalRes.blob()
            } catch (e) {
               console.warn("Could not fetch original image", e)
               shouldUploadOriginal = false;
            }
         }
      } else {
         const originalRes = await fetch(cropImageSrc)
         originalBlobToUpload = await originalRes.blob()
      }

      if (shouldUploadOriginal && originalBlobToUpload) {
         let originalExt = 'jpeg'
         if (originalBlobToUpload.type) {
            originalExt = originalBlobToUpload.type.split('/')[1] || 'jpeg'
         } else if (cropImageSrc.includes('.')) {
            originalExt = cropImageSrc.split('.').pop()?.split('?')[0] || 'jpeg'
         }

         const formDataOriginal = new FormData()
         formDataOriginal.append('file', originalBlobToUpload)
         formDataOriginal.append('bucket', 'marketplace-images')
         formDataOriginal.append('path', `pos-menus/${uuid}_original.${originalExt}`)

         await fetch('/api/admin/storage/upload', {
           method: 'POST',
           headers: authHeaders,
           body: formDataOriginal
         })
      }

      // Upload cropped file
      const file = new File([croppedBlob], `${uuid}_cropped.jpeg`, { type: 'image/jpeg' })
      const formDataCropped = new FormData()
      formDataCropped.append('file', file)
      formDataCropped.append('bucket', 'marketplace-images')
      formDataCropped.append('path', `pos-menus/${uuid}_cropped.jpeg`)

      const uploadRes = await fetch('/api/admin/storage/upload', {
        method: 'POST',
        headers: authHeaders,
        body: formDataCropped
      })

      const uploadResult = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadResult.error || 'Failed to upload file')

      setEditingItem({ ...editingItem, image_url: uploadResult.publicUrl })
      setIsCropping(false)
      setCropImageSrc(null)
    } catch (error: any) {
      alert('Error cropping/uploading image: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
      if (!confirm('ยืนยันการลบรายการนี้?')) return
      await supabase.from('pos_menu_items').delete().eq('id', id)
      fetchData()
  }

  const filteredItems = useMemo(() => sortMenuItems(items.filter(item => {
      const matchesSearch = getMenuSearchText(item).includes(searchTerm.toLowerCase())
      const matchesCategory = !activeCategory || item.category_id === activeCategory
      return matchesSearch && matchesCategory
  })), [items, searchTerm, activeCategory])

  const handleGroupedItemsReorder = (categoryKey: string, reorderedIds: string[]) => {
      setReorderDraft(prev => ({ ...prev, [categoryKey]: reorderedIds }))
      setDirtyCategoryKeys(prev => (prev.includes(categoryKey) ? prev : [...prev, categoryKey]))
  }

  return (
    <>
      <div className="p-4 sm:p-10 font-bold overflow-y-auto no-scrollbar">
          
          {/* 1. SEARCH BAR */}
          <div className="mb-6">
              <div className="relative group w-full">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#1A1A18]" />
                  <input 
                      type="text" 
                      placeholder={locale === 'en' ? 'ค้นหาชื่อเมนู หรือ ข้อมูลอาหาร...' : locale === 'zh' ? 'ค้นหาชื่อเมนู หรือ ข้อมูลอาหาร...' : 'ค้นหาชื่อเมนู หรือ ข้อมูลอาหาร...'} 
                      className="w-full bg-white border border-[#F0F0E8] py-4 pl-12 pr-4 text-[14px] outline-none focus:border-[#1A1A18] transition-all font-bold placeholder:text-gray-200 text-black shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>

          {/* 2. CATEGORIES BAR */}
          <div className="bg-white border-b border-[#F0F0E8] mb-10">
              <div className="flex items-center overflow-x-auto no-scrollbar pb-4 gap-2">
                    <button onClick={() => setActiveCategory(null)} className={`whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${!activeCategory ? 'bg-[#1A1A18] text-white' : 'bg-gray-100 text-gray-400 hover:text-[#1A1A18]'}`}>{locale === 'en' ? 'ทั้งหมด' : locale === 'zh' ? 'ทั้งหมด' : 'ทั้งหมด'}</button>
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.id ? 'bg-[#1A1A18] text-white' : 'bg-gray-100 text-gray-400 hover:text-[#1A1A18]'}`}>{cat.name}</button>
                    ))}
              </div>
          </div>

          {/* 3. MAIN LIST */}
          <div className="flex-1">
          {loading ? (
               <div className="h-full flex items-center justify-center opacity-20 font-bold border-none">
                   <Loader2 className="animate-spin font-bold border-none font-bold font-bold" size={48} />
               </div>
           ) : viewMode === 'stock' ? (
               <div className="relative h-full pb-20">
                 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                     {filteredItems.map(item => {
                         const currentStatus = stockDraft[item.id] !== undefined ? stockDraft[item.id] : (item.in_stock !== false);
                         return (
                         <div key={item.id} className={`group bg-white border flex flex-col transition-all overflow-hidden rounded-2xl ${!currentStatus ? 'border-red-200 bg-red-50/30 opacity-80' : 'border-[#E5E5DF] hover:shadow-2xl hover:-translate-y-1'}`}>
                             <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                                 {item.image_url ? <img loading="lazy" crossOrigin="anonymous"  src={item.image_url || ''} className={`w-full h-full object-cover transition-transform duration-700 ${!currentStatus ? 'grayscale' : 'group-hover:scale-105'}`} /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="text-gray-200" /></div>}
                                 {!currentStatus && (
                                     <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center backdrop-blur-[2px]">
                                         <div className="bg-red-600 text-white px-5 py-2 font-black tracking-[0.2em] uppercase text-sm -rotate-12 shadow-2xl border-2 border-red-400/50">SOLD OUT</div>
                                     </div>
                                 )}
                             </div>
                             <div className="p-4 sm:p-5 flex flex-col flex-1">
                                 <div className="text-[9px] font-black uppercase tracking-widest text-sage-600 mb-1">{item.category?.name || 'GENERIC'}</div>
                                 <h4 className="text-[13px] sm:text-[15px] font-black tracking-tight leading-tight line-clamp-2 min-h-10 text-black mb-4">{getPrimaryMenuName(item)}</h4>
                                 
                                 <div className="mt-auto">
                                     <button 
                                         onClick={() => handleStockDraftToggle(item.id, currentStatus)}
                                         className={`w-full h-12 sm:h-14 flex items-center justify-center gap-2 rounded-xl transition-all font-black text-[11px] sm:text-[13px] tracking-widest uppercase active:scale-95 ${currentStatus ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 shadow-inner'}`}
                                     >
                                         {currentStatus ? (
                                             <><CheckCircle2 size={18} /> มีของ (IN STOCK)</>
                                         ) : (
                                             <><XCircle size={18} /> หมด (SOLD OUT)</>
                                         )}
                                     </button>
                                 </div>
                             </div>
                         </div>
                     )})}
                 </div>
                 
                 <AnimatePresence>
                     {Object.keys(stockDraft).length > 0 && (
                         <motion.div 
                             initial={{ y: 100, opacity: 0 }}
                             animate={{ y: 0, opacity: 1 }}
                             exit={{ y: 100, opacity: 0 }}
                             className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100"
                         >
                             <div className="text-sm font-bold text-gray-600 whitespace-nowrap hidden sm:block">
                                 มีการเปลี่ยนแปลง <span className="text-amber-500 font-black">{Object.keys(stockDraft).length}</span> รายการ
                             </div>
                             <button
                                 onClick={() => setStockDraft({})}
                                 className="px-6 h-12 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                             >
                                 ยกเลิก
                             </button>
                             <button
                                 onClick={handleSaveStockDraft}
                                 disabled={isSaving}
                                 className="px-8 h-12 bg-black text-white font-black rounded-xl hover:bg-gray-800 hover:-translate-y-1 transition-all shadow-xl flex items-center gap-2"
                             >
                                 {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                 บันทึกการเปลี่ยนแปลง
                             </button>
                         </motion.div>
                     )}
                 </AnimatePresence>
               </div>
           ) : viewMode === 'grid' ? (
               
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 pb-20">
                   {/* Add Menu Ghost Card */}
                   {canEditMenu && (
                     <button
                         onClick={() => { setEditingItem({ name: '', name_en: '', name_zh: '', sale_price: 0, status: 'active', category_id: categories[0]?.id }); setIsEditorOpen(true); }}
                         className="group relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-3xl min-h-[220px] transition-all hover:bg-white hover:border-black hover:shadow-lg"
                     >
                         <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm text-gray-400 group-hover:bg-[#1A1A18] group-hover:text-white group-hover:border-black transition-all duration-300">
                             <Plus size={20} />
                         </div>
                         <span className="mt-4 text-[13px] font-black tracking-widest text-gray-400 group-hover:text-black uppercase">
                             {locale === 'en' ? 'Add Menu' : 'เพิ่มเมนูใหม่'}
                         </span>
                     </button>
                   )}
                   
                   {filteredItems.map(item => (
                       <div key={item.id} className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => { if (canEditMenu) { setEditingItem(item); fetchItemLinks(item.id); setIsEditorOpen(true); } }}>
                           <div className="aspect-square relative overflow-hidden bg-gray-50">
                               {item.image_url ? (
                                   <img loading="lazy" crossOrigin="anonymous"  src={item.image_url || ''} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                               ) : (
                                   <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50/50 group-hover:bg-gray-100 transition-colors">
                                       <ImageIcon size={32} />
                                   </div>
                               )}
                               <div className="absolute top-3 left-3 flex flex-col gap-1">
                                   {item.is_recommended && (
                                       <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest shadow-md uppercase">Recommend</span>
                                   )}
                                   {item.out_of_stock && (
                                       <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest shadow-md uppercase">Out of Stock</span>
                                   )}
                               </div>
                               <div className="absolute top-3 right-3 flex gap-1">
                                    <div className="flex bg-white/90 backdrop-blur-sm rounded-full shadow-sm p-1">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${item.allow_takeaway ? 'text-[#1A1A18]' : 'text-gray-300'}`} title="Takeaway">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${item.allow_delivery ? 'text-[#1A1A18]' : 'text-gray-300'}`} title="Delivery">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8n-11 4h-3m-13 5v2m0 0v2m0-2h2m-2 0H3m2 0V5a2 2 0 012-2h2a2 2 0 012 2v2" /></svg>
                                        </div>
                                    </div>
                               </div>
                           </div>
                           <div className="p-4 sm:p-5 flex flex-col flex-1">
                               <div className="flex-1">
                                   <div className="text-[14px] font-black text-gray-900 leading-tight line-clamp-2">{getPrimaryMenuName(item)}</div>
                                   {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
                                       <div className="text-[11px] font-bold text-gray-400 mt-1 line-clamp-1">{getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}</div>
                                   )}
                               </div>
                               <div className="flex flex-col gap-3 mt-4">
                                   <div className="flex items-end justify-between">
                                        <div className="text-[16px] font-black text-gray-900">
                                            <span className="text-[11px] text-gray-500 mr-1">฿</span>
                                            {item.sale_price.toLocaleString()}
                                        </div>
                                        {canEditMenu && (
                                            <div className="flex items-center gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); fetchItemLinks(item.id); setIsEditorOpen(true); }} className="w-7 h-7 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-black hover:text-white transition-all"><Edit3 size={12} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                                            </div>
                                        )}
                                   </div>
                                   <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                       <div className="flex flex-col">
                                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ต้นทุน</span>
                                           <span className="text-[11px] font-bold text-gray-700">฿ {Number(item.cost_price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                       </div>
                                       <div className="flex flex-col items-end">
                                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">กำไร</span>
                                           <span className={`text-[11px] font-black ${item.sale_price > 0 && ((item.sale_price - (item.cost_price || 0)) / item.sale_price) > 0.5 ? 'text-emerald-500' : 'text-gray-500'}`}>
                                               {item.sale_price > 0 ? Math.round(((item.sale_price - (item.cost_price || 0)) / item.sale_price) * 100) : 0}%
                                           </span>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           ) : reorderMode ? (
            <div className="space-y-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
                    ลากเมนูภายในแต่ละหมวดเพื่อกำหนดลำดับที่ลูกค้าและพนักงานจะเห็น แล้วกดปุ่ม "บันทึกลำดับ"
                </div>
                {categorySections.map(cat => {
                    const itemIdsInCat = reorderDraft[cat.id] || []
                    const itemsInCat = itemIdsInCat
                      .map(itemId => itemMap.get(itemId))
                      .filter(Boolean)

                    if (itemsInCat.length === 0) return null

                    return (
                      <div key={cat.id} className="overflow-hidden rounded-2xl border border-[#F0F0E8] bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-[#F0F0E8] bg-[#1A1A18] px-5 py-4 text-white">
                          <div>
                            <h3 className="text-lg font-black uppercase tracking-widest">{cat.name}</h3>
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                              {itemsInCat.length} items
                            </p>
                          </div>
                          {dirtyCategoryKeys.includes(cat.id) && (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
                              ยังไม่บันทึก
                            </span>
                          )}
                        </div>

                        <Reorder.Group
                          axis="y"
                          values={itemIdsInCat}
                          onReorder={(nextOrder) => handleGroupedItemsReorder(cat.id, nextOrder)}
                          className="divide-y divide-[#F0F0E8]"
                        >
                          {itemsInCat.map((item, idx) => (
                            <Reorder.Item
                              key={item.id}
                              value={item.id}
                              dragMomentum={false}
                              dragElastic={0.02}
                              whileDrag={{ scale: 1.008, boxShadow: '0 14px 32px rgba(15, 23, 42, 0.14)' }}
                              transition={{ duration: 0.08 }}
                              className="flex cursor-grab touch-none items-center gap-4 bg-white px-4 py-4 active:cursor-grabbing sm:px-5"
                            >
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#F0F0E8] bg-[#FAF9F6] text-gray-400">
                                <MenuIcon size={14} />
                              </div>
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[#F0F0E8] bg-gray-50">
                                {item.image_url ? <img loading="lazy" crossOrigin="anonymous"  src={item.image_url || ''} className="h-full w-full object-cover" /> : <ImageIcon size={16} className="text-gray-300" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-black text-[#1A1A18]">{getPrimaryMenuName(item)}</div>
                                {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en') && (
                                  <div className="mt-1 truncate text-[11px] font-semibold text-gray-500">
                                    {getSecondaryMenuName(item, locale === 'zh' ? 'zh' : 'en')}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">ลำดับ</div>
                                <div className="mt-1 text-sm font-black text-[#1A1A18]">#{idx + 1}</div>
                              </div>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </div>
                    )
                })}
            </div>
           ) : (
            <div className="bg-white border border-[#F0F0E8] overflow-x-auto relative min-h-[500px]">
                <div className="absolute left-0 top-[-40px] z-20">
                  <button 
                      onClick={() => setShowColumnSelector(!showColumnSelector)}
                      className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-gray-50 px-4 py-2 border border-[#F0F0E8] hover:border-black transition-all"
                  >
                      <Settings size={12} /> {locale === 'en' ? 'Customize table' : locale === 'zh' ? '自定义表格' : 'ปรับแต่งตาราง'}</button>
                  <AnimatePresence>
                      {showColumnSelector && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 top-12 w-64 bg-white border border-black shadow-2xl p-6 z-30 space-y-4">
                              <div className="text-[10px] font-black uppercase tracking-widest border-b border-gray-50 pb-2 mb-4">{locale === 'en' ? 'แสดงคอลัมน์' : locale === 'zh' ? 'แสดงคอลัมน์' : 'แสดงคอลัมน์'}</div>
                              {columns.map(col => (
                                  <label key={col.id} className="flex items-center gap-3 cursor-pointer group">
                                      <input 
                                          type="checkbox" 
                                          className="accent-black w-4 h-4" 
                                          checked={visibleColumns.includes(col.id)}
                                          onChange={() => setVisibleColumns(prev => prev.includes(col.id) ? prev.filter(p => p !== col.id) : [...prev, col.id])}
                                      />
                                      <span className="text-[11px] font-black uppercase text-gray-400 group-hover:text-black transition-colors">{col.label}</span>
                                  </label>
                              ))}
                          </motion.div>
                      )}
                  </AnimatePresence>
                </div>

                <div className="space-y-8 pb-20">
                    {categorySections.map(cat => {
                        const itemsInCat = filteredItems.filter(item => 
                            cat.id === 'uncategorized' 
                            ? !item.category_id || !categories.find(c => c.id === item.category_id)
                            : item.category_id === cat.id
                        );
                        
                        if (itemsInCat.length === 0) return null;

                        const activePlatforms = shopSettings?.opening_hours?.active_delivery_platforms || ['grab', 'lineman', 'shopee', 'foodpanda', 'robinhood'];

                        return (
                            <div key={cat.id} className="bg-white border border-gray-100/80 rounded-3xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 rounded-full bg-[#1A1A18]"></div>
                                        <h3 className="text-[16px] sm:text-[18px] font-black text-gray-900 tracking-tight">{cat.name}</h3>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500 bg-white shadow-sm px-3 py-1 rounded-full">{itemsInCat.length} Items</span>
                                </div>
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left min-w-[900px] border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-16 text-center">รูป</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 min-w-[200px]">รายละเอียดเมนู</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-32 text-center bg-gray-50/30">ต้นทุน (฿)</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-32 text-center bg-gray-50/50">ราคาขาย (฿)</th>
                                                
                                                {activePlatforms.includes('grab') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#00B14F] w-28 text-center bg-[#00B14F]/5">Grab</th>}
                                                {activePlatforms.includes('lineman') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#00B900] w-28 text-center bg-[#00B900]/5">Lineman</th>}
                                                {activePlatforms.includes('shopee') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#EE4D2D] w-28 text-center bg-[#EE4D2D]/5">Shopee</th>}
                                                {activePlatforms.includes('foodpanda') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#D70F64] w-28 text-center bg-[#D70F64]/5">Foodpanda</th>}
                                                {activePlatforms.includes('robinhood') && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6023A2] w-28 text-center bg-[#6023A2]/5">Robinhood</th>}
                                                
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 min-w-[100px] text-center">ตัวเลือก</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-32 text-center">สถานะ</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 w-16 text-center">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {itemsInCat.map((item, idx) => (
                                                <tr key={item.id} className="group hover:bg-gray-50/40 transition-colors align-middle">
                                                    {/* Image Column */}
                                                    <td className="p-4 text-center">
                                                        <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden mx-auto shadow-sm group-hover:shadow transition-all">
                                                            {item.image_url ? (
                                                                <img loading="lazy" crossOrigin="anonymous"  src={item.image_url || ''} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={14} /></div>
                                                            )}
                                                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleInlineImageUpload(item.id, e.target.files?.[0])} />
                                                                <span className="text-[9px] font-black text-white uppercase tracking-widest">เปลี่ยน</span>
                                                            </label>
                                                        </div>
                                                    </td>

                                                    {/* Details Column */}
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <input 
                                                                type="text" 
                                                                defaultValue={item.name} 
                                                                onBlur={(e) => handleBulkUpdate(item.id, 'name', e.target.value)}
                                                                className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md px-2 py-1 -ml-2 text-[14px] font-black text-gray-900 transition-all"
                                                            />
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    defaultValue={item.name_en || ''}
                                                                    onBlur={(e) => handleBulkUpdate(item.id, 'name_en', e.target.value)}
                                                                    placeholder="EN Name"
                                                                    className="w-1/2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md px-2 py-1 -ml-2 text-[11px] font-bold text-gray-400 transition-all placeholder:text-gray-300"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    defaultValue={item.name_zh || ''}
                                                                    onBlur={(e) => handleBulkUpdate(item.id, 'name_zh', e.target.value)}
                                                                    placeholder="ZH Name"
                                                                    className="w-1/2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md px-2 py-1 text-[11px] font-bold text-gray-400 transition-all placeholder:text-gray-300"
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Cost Column */}
                                                    <td className="p-4 bg-gray-50/30">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            defaultValue={item.cost_price ? Number(item.cost_price).toFixed(2) : ''}
                                                            onBlur={(e) => handleBulkUpdate(item.id, 'cost_price', Number(e.target.value))}
                                                            placeholder="0.00"
                                                            className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md py-1.5 text-[14px] font-black text-gray-500 text-center transition-all"
                                                        />
                                                        {item.sale_price > 0 && (
                                                            <div className="text-[9px] font-bold text-center mt-1 text-gray-400">
                                                                กำไร: <span className={((item.sale_price - (item.cost_price || 0)) / item.sale_price) > 0.5 ? 'text-emerald-500' : 'text-gray-500'}>
                                                                    {Math.round(((item.sale_price - (item.cost_price || 0)) / item.sale_price) * 100)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Sale Price Column */}
                                                    <td className="p-4 bg-gray-50/50">
                                                        <input 
                                                            type="number" 
                                                            defaultValue={item.sale_price} 
                                                            onBlur={(e) => handleBulkUpdate(item.id, 'sale_price', Number(e.target.value))}
                                                            className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-black/10 rounded-md py-1.5 text-[15px] font-black text-gray-900 text-center transition-all"
                                                        />
                                                    </td>
                                                    
                                                    {/* Platform Prices */}
                                                    {activePlatforms.includes('grab') && (
                                                        <td className="p-4 bg-[#00B14F]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.grab || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), grab: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#00B14F]/20 rounded-md py-1.5 text-[14px] font-black text-[#00B14F] text-center placeholder:text-[#00B14F]/30 transition-all" />
                                                        </td>
                                                    )}
                                                    {activePlatforms.includes('lineman') && (
                                                        <td className="p-4 bg-[#00B900]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.lineman || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), lineman: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#00B900]/20 rounded-md py-1.5 text-[14px] font-black text-[#00B900] text-center placeholder:text-[#00B900]/30 transition-all" />
                                                        </td>
                                                    )}
                                                    {activePlatforms.includes('shopee') && (
                                                        <td className="p-4 bg-[#EE4D2D]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.shopee || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), shopee: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#EE4D2D]/20 rounded-md py-1.5 text-[14px] font-black text-[#EE4D2D] text-center placeholder:text-[#EE4D2D]/30 transition-all" />
                                                        </td>
                                                    )}
                                                    {activePlatforms.includes('foodpanda') && (
                                                        <td className="p-4 bg-[#D70F64]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.foodpanda || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), foodpanda: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#D70F64]/20 rounded-md py-1.5 text-[14px] font-black text-[#D70F64] text-center placeholder:text-[#D70F64]/30 transition-all" />
                                                        </td>
                                                    )}
                                                    {activePlatforms.includes('robinhood') && (
                                                        <td className="p-4 bg-[#6023A2]/5">
                                                            <input type="number" defaultValue={item.platform_prices?.robinhood || ''} placeholder="Auto" onBlur={(e) => handleBulkUpdate(item.id, 'platform_prices', {...(item.platform_prices || {}), robinhood: Number(e.target.value) || null})} className="w-full bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#6023A2]/20 rounded-md py-1.5 text-[14px] font-black text-[#6023A2] text-center placeholder:text-[#6023A2]/30 transition-all" />
                                                        </td>
                                                    )}

                                                    {/* Options Column */}
                                                    <td className="p-4 align-middle">
                                                        <div className="flex flex-wrap gap-1 justify-center max-w-[160px] mx-auto">
                                                            {allModifierGroups.map(group => {
                                                                const active = (item.modifiers || []).some((modifier: any) => modifier.group_id === group.id)
                                                                return (
                                                                    <button
                                                                        key={group.id}
                                                                        type="button"
                                                                        onClick={() => handleModifierGroupToggle(item.id, group.id)}
                                                                        className={`px-2 py-1 text-[9px] font-bold tracking-wider rounded transition-all ${
                                                                            active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                                        }`}
                                                                    >
                                                                        {group.name}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </td>

                                                    {/* Status Column */}
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-2 items-center">
                                                            <button
                                                                onClick={() => handleBulkUpdate(item.id, 'status', item.status === 'active' ? 'inactive' : 'active')}
                                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${item.status === 'active' ? 'bg-[#1A1A18]' : 'bg-gray-200'}`}
                                                            >
                                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.status === 'active' ? 'translate-x-5' : 'translate-x-1'}`} />
                                                            </button>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleBulkUpdate(item.id, 'is_recommended', !item.is_recommended)}
                                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${item.is_recommended ? 'bg-amber-100 text-amber-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                                    title="Recommend"
                                                                >
                                                                    <Star size={11} className={item.is_recommended ? "fill-amber-500" : ""} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleBulkUpdate(item.id, 'out_of_stock', !item.out_of_stock)}
                                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${item.out_of_stock ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                                    title="Out of Stock"
                                                                >
                                                                    <AlertCircle size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Actions Column */}
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => handleDeleteItem(item.id)} 
                                                            className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}

                    {filteredItems.length === 0 && (
                      <div className="flex min-h-[280px] items-center justify-center border border-dashed border-[#E5E5DF] bg-[#FAF9F6] px-6 text-center">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#8C8A81]">ไม่พบเมนู</div>
                          <p className="mt-3 text-sm font-semibold text-gray-500">
                            ลองล้างคำค้นหา หรือเลือกหมวดหมู่อื่น
                          </p>
                        </div>
                      </div>
                    )}
                </div>
            </div>
           )}
           </div>
      </div>
      {/* EDITOR MODAL (Full width on mobile) */}
      {isEditorOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-end font-bold">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300 font-bold" onClick={() => setIsEditorOpen(false)}></div>
              <div className="relative w-full sm:max-w-xl bg-[#F5F4F0] h-full shadow-2xl flex flex-col py-10 sm:py-20 px-6 sm:px-16 animate-in slide-in-from-right duration-500 font-bold overflow-y-auto no-scrollbar">
                  <header className="mb-10 sm:mb-16 flex justify-between items-start font-bold">
                      <div className="font-bold">
                          <h2 className="font-serif-luxury text-4xl sm:text-5xl font-light tracking-tighter text-[#1A1A18] border-none font-bold">MENU ASSET</h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8C8A81] mt-4 font-bold font-bold font-bold">PROPERTIES • {editingItem.id ? 'EDIT' : 'NEW entry'}</p>
                      </div>
                      <button onClick={() => setIsEditorOpen(false)} className="w-12 h-12 bg-white flex items-center justify-center font-bold font-bold"><X size={24} /></button>
                  </header>

                  <div className="space-y-8 font-bold border-none font-bold">
                      <div className="space-y-3 font-bold border-none font-bold font-bold">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold">{locale === 'en' ? 'ASSET NAME / ชื่อเมนู' : locale === 'zh' ? 'ASSET NAME / ชื่อเมนู' : 'ASSET NAME / ชื่อเมนู'}</label>
                          <input 
                              type="text"
                              value={editingItem.name}
                              onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                              className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none focus:border-[#1A1A18] font-bold text-black font-bold font-bold font-bold font-bold font-bold"
                          />
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50">English Name</label>
                              <input
                                  type="text"
                                  value={editingItem.name_en || ''}
                                  onChange={e => setEditingItem({ ...editingItem, name_en: e.target.value })}
                                  placeholder="Iced Latte"
                                  className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none focus:border-[#1A1A18] font-bold text-black"
                              />
                          </div>
                          <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50">Chinese Name</label>
                              <input
                                  type="text"
                                  value={editingItem.name_zh || ''}
                                  onChange={e => setEditingItem({ ...editingItem, name_zh: e.target.value })}
                                  placeholder="冰拿铁"
                                  className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none focus:border-[#1A1A18] font-bold text-black"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 font-bold border-none font-bold font-bold font-bold">
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold font-bold font-bold">SALE PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.sale_price}
                                  onChange={e => setEditingItem({...editingItem, sale_price: Number(e.target.value)})}
                                  className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none font-bold text-black font-bold font-bold font-bold border-none font-bold"
                              />
                          </div>
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">COST PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.cost_price}
                                  onChange={e => setEditingItem({...editingItem, cost_price: Number(e.target.value)})}
                                  className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none font-bold text-black font-bold font-bold border-none font-bold"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 font-bold border-none font-bold font-bold font-bold mt-6">
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('grab')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold font-bold font-bold">GRAB PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.grab || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), grab: Number(e.target.value) || null}})}
                                  className="w-full bg-[#00B14F]/10 border border-[#00B14F]/30 py-5 px-6 text-sm outline-none font-bold text-[#00B14F] placeholder:text-[#00B14F]/50 focus:border-[#00B14F]"
                                  placeholder="Auto"
                              />
                          </div>)}
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('lineman')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">LINEMAN PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.lineman || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), lineman: Number(e.target.value) || null}})}
                                  className="w-full bg-[#00B900]/10 border border-[#00B900]/30 py-5 px-6 text-sm outline-none font-bold text-[#00B900] placeholder:text-[#00B900]/50 focus:border-[#00B900]"
                                  placeholder="Auto"
                              />
                          </div>)}
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('shopee')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">SHOPEE PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.shopee || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), shopee: Number(e.target.value) || null}})}
                                  className="w-full bg-[#EE4D2D]/10 border border-[#EE4D2D]/30 py-5 px-6 text-sm outline-none font-bold text-[#EE4D2D] placeholder:text-[#EE4D2D]/50 focus:border-[#EE4D2D]"
                                  placeholder="Auto"
                              />
                          </div>)}
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('foodpanda')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">FOODPANDA PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.foodpanda || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), foodpanda: Number(e.target.value) || null}})}
                                  className="w-full bg-[#D70F64]/10 border border-[#D70F64]/30 py-5 px-6 text-sm outline-none font-bold text-[#D70F64] placeholder:text-[#D70F64]/50 focus:border-[#D70F64]"
                                  placeholder="Auto"
                              />
                          </div>)}
                          {(!shopSettings?.opening_hours?.active_delivery_platforms || shopSettings.opening_hours.active_delivery_platforms.includes('robinhood')) && (
                          <div className="space-y-3 font-bold border-none font-bold font-bold font-bold font-bold">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">ROBINHOOD PRICE</label>
                              <input 
                                  type="number"
                                  value={editingItem.platform_prices?.robinhood || ''}
                                  onChange={e => setEditingItem({...editingItem, platform_prices: {...(editingItem.platform_prices || {}), robinhood: Number(e.target.value) || null}})}
                                  className="w-full bg-[#6023A2]/10 border border-[#6023A2]/30 py-5 px-6 text-sm outline-none font-bold text-[#6023A2] placeholder:text-[#6023A2]/50 focus:border-[#6023A2]"
                                  placeholder="Auto"
                              />
                          </div>)}
                      </div>

                      <div className="space-y-3 font-bold border-none font-bold font-bold font-bold">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold font-bold font-bold">{locale === 'en' ? 'CATEGORY / หมวดหมู่' : locale === 'zh' ? 'CATEGORY / หมวดหมู่' : 'CATEGORY / หมวดหมู่'}</label>
                          <select 
                              value={editingItem.category_id || ''}
                              onChange={e => setEditingItem({...editingItem, category_id: e.target.value})}
                              className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none font-black text-black font-bold font-bold border-none font-bold font-bold"
                          >
                              <option value="">SELECT CATEGORY...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>

                      <div className="space-y-3 font-bold border-none font-bold">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold">{locale === 'en' ? 'DESCRIPTION / คำอธิบาย' : locale === 'zh' ? 'DESCRIPTION / คำอธิบาย' : 'DESCRIPTION / คำอธิบาย'}</label>
                          <textarea 
                              value={editingItem.description || ''}
                              onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                              placeholder="Describe this asset (Flavor notes, ingredients, etc.)"
                              className="w-full bg-white border border-[#E5E5DF] py-5 px-6 text-sm outline-none focus:border-[#1A1A18] font-bold text-black min-h-[120px] resize-none"
                          />
                      </div>

                      <div className="space-y-4 font-bold border-none font-bold pb-10">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold">{locale === 'en' ? 'MODIFIERS / ตัวเลือกเสริม' : locale === 'zh' ? 'MODIFIERS / ตัวเลือกเสริม' : 'MODIFIERS / ตัวเลือกเสริม'}</label>
                          <div className="grid grid-cols-2 gap-3">
                              {allModifierGroups.map(group => {
                                  const isActive = itemModifierLinks.includes(group.id);
                                  return (
                                      <button 
                                          key={group.id}
                                          type="button"
                                          onClick={() => setItemModifierLinks(prev => isActive ? prev.filter(id => id !== group.id) : [...prev, group.id])}
                                          className={`p-4 border text-left transition-all flex justify-between items-center group/mod ${isActive ? 'bg-[#1A1A18] border-[#1A1A18] text-white shadow-lg' : 'bg-white border-[#E5E5DF] text-[#1A1A18] hover:border-[#1A1A18]'}`}
                                      >
                                          <div className="flex flex-col">
                                              <span className="text-[11px] font-black uppercase leading-tight">{group.name}</span>
                                              <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isActive ? 'text-emerald-400' : 'text-gray-300'}`}>
                                                  {isActive ? 'Active' : 'Not Linked'}
                                              </span>
                                          </div>
                                          <div className={`w-6 h-6 flex items-center justify-center transition-all ${isActive ? 'bg-emerald-500 scale-110' : 'bg-gray-50 border border-gray-100 opacity-20'}`}>
                                              {isActive && <Check size={12} className="text-white" />}
                                          </div>
                                      </button>
                                  );
                              })}
                          </div>
                          {allModifierGroups.length === 0 && (
                              <div className="p-6 bg-gray-50 border border-gray-100 text-[10px] font-black uppercase text-gray-400 text-center tracking-widest">
                                  No modifier groups defined.
                              </div>
                          )}
                      </div>

                      <div className="space-y-3 font-bold border-none font-bold">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A18]/50 font-bold">{locale === 'en' ? 'IMAGE / รูปภาพ' : locale === 'zh' ? 'IMAGE / รูปภาพ' : 'IMAGE / รูปภาพ'}</label>
                          <div className="flex flex-col gap-4">
                              <div className="aspect-square bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                                  {editingItem.image_url ? (
                                      <>
                                          <img loading="lazy" crossOrigin="anonymous"  src={editingItem.image_url || ''} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                          <div className="absolute top-4 right-4 flex gap-2">
                                              <button 
                                                  onClick={() => {
                                                    let src = editingItem.image_url
                                                    if (src && src.includes('_cropped.')) {
                                                        src = src.replace('_cropped.', '_original.')
                                                    }
                                                    setCropImageSrc(src)
                                                    setIsCropping(true)
                                                    setCropAspect(1)
                                                  }}
                                                  className="p-2 bg-black/80 backdrop-blur-md shadow-xl text-white hover:bg-black transition-all"
                                              >
                                                  <Crop size={16} />
                                              </button>
                                              <button 
                                                  onClick={() => setEditingItem({...editingItem, image_url: null})}
                                                  className="p-2 bg-white/80 backdrop-blur-md shadow-xl text-red-500 hover:bg-white transition-all"
                                              >
                                                  <Trash size={16} />
                                              </button>
                                          </div>
                                      </>
                                  ) : (
                                      <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-100 transition-all">
                                          <ImageIcon size={48} />
                                          <span className="text-[8px] font-black uppercase tracking-widest">No Image Asset</span>
                                      </div>
                                  )}
                              </div>
                              <label className="cursor-pointer w-full h-16 border border-[#1A1A18] flex items-center justify-center gap-4 hover:bg-gray-50 transition-all font-bold">
                                  <ImageIcon size={16} />
                                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                      {editingItem.image_url ? 'CHANGE IMAGE' : 'UPLOAD IMAGE'}
                                  </span>
                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isSaving} />
                              </label>
                          </div>
                      </div>

                      <div className="p-6 bg-amber-50 border border-amber-100 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-amber-100 text-amber-600 rounded-[16px]">
                                  <Star size={20} fill="currentColor" />
                              </div>
                              <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900">Recommended Item</h4>
                                  <p className="text-[8px] font-bold text-amber-600/60 uppercase mt-0.5 tracking-widest">Show in Signature section on LIFF</p>
                              </div>
                          </div>
                          <button 
                              onClick={() => setEditingItem({...editingItem, is_recommended: !editingItem?.is_recommended})}
                              type="button"
                              className={`w-14 h-8 rounded-none relative transition-all duration-300 ${editingItem?.is_recommended ? 'bg-amber-400' : 'bg-gray-200'}`}
                          >
                              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-none transition-all duration-300 ${editingItem?.is_recommended ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>

                      <div className="p-6 bg-rose-50 border border-rose-100 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-rose-100 text-rose-600 rounded-[16px]">
                                  <Star size={20} fill="currentColor" />
                              </div>
                              <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-900">Popular Item</h4>
                                  <p className="text-[8px] font-bold text-rose-600/60 uppercase mt-0.5 tracking-widest">Highlight as popular menu</p>
                              </div>
                          </div>
                          <button 
                              onClick={() => setEditingItem({...editingItem, is_popular: !editingItem?.is_popular})}
                              type="button"
                              className={`w-14 h-8 rounded-none relative transition-all duration-300 ${editingItem?.is_popular ? 'bg-rose-500' : 'bg-gray-200'}`}
                          >
                              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-none transition-all duration-300 ${editingItem?.is_popular ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>

                      <div className="p-6 bg-emerald-50 border border-emerald-100 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-[16px]">
                                  <Check size={20} />
                              </div>
                              <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Available Online (QR Menu)</h4>
                                  <p className="text-[8px] font-bold text-emerald-600/60 uppercase mt-0.5 tracking-widest">Allow customers to order via QR Code</p>
                              </div>
                          </div>
                          <button 
                              onClick={() => setEditingItem({...editingItem, is_online_available: editingItem.is_online_available === undefined ? false : !editingItem.is_online_available})}
                              type="button"
                              className={`w-14 h-8 rounded-none relative transition-all duration-300 ${editingItem?.is_online_available !== false ? 'bg-emerald-500' : 'bg-gray-200'}`}
                          >
                              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-none transition-all duration-300 ${editingItem?.is_online_available !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>

                      <div className="p-6 bg-blue-50 border border-blue-100 flex items-center justify-between transition-all">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 text-blue-600 rounded-[16px]">
                                  <Check size={20} />
                              </div>
                              <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-900">Available for Delivery</h4>
                                  <p className="text-[8px] font-bold text-blue-600/60 uppercase mt-0.5 tracking-widest">Allow customers to order for delivery</p>
                              </div>
                          </div>
                          <button 
                              onClick={() => setEditingItem({...editingItem, is_delivery_available: editingItem.is_delivery_available === undefined ? false : !editingItem.is_delivery_available})}
                              type="button"
                              className={`w-14 h-8 rounded-none relative transition-all duration-300 ${editingItem?.is_delivery_available !== false ? 'bg-blue-500' : 'bg-gray-200'}`}
                          >
                              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-none transition-all duration-300 ${editingItem?.is_delivery_available !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>
                  </div>

                  <button onClick={handleSaveItem} disabled={isSaving} className="w-full mt-auto py-8 bg-[#1A1A18] text-white text-[11px] font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-6 font-bold">
                     {isSaving ? <Loader2 className="animate-spin text-white font-bold font-bold font-bold" /> : (editingItem.id ? 'บันทึกการแก้ไข' : 'เพิ่มรายการเมนู')}
                  </button>
              </div>
          </div>
      )}

      {/* Image Cropper Modal */}
      {isCropping && cropImageSrc && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full flex flex-col h-[80vh] sm:h-auto sm:max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#1A1A18]">Crop Image</h3>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Adjust your image to fit perfectly</p>
              </div>
              <button onClick={() => {
                setIsCropping(false)
                setCropImageSrc(null)
              }} className="p-2 hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 min-h-[400px] relative bg-gray-900">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onMediaLoaded={(mediaSize) => setMediaSize(mediaSize)}
              />
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <ZoomOut size={16} className="text-gray-400" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-black h-1 bg-gray-200 appearance-none outline-none"
                />
                <ZoomIn size={16} className="text-gray-400" />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCropping(false)
                    setCropImageSrc(null)
                  }}
                  className="px-6 py-3 border border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {mediaSize && (
                  <button
                    onClick={() => {
                      setCropAspect(mediaSize.width / mediaSize.height)
                      setZoom(1)
                      setCrop({ x: 0, y: 0 })
                    }}
                    className="px-4 py-3 border border-gray-200 bg-white text-[#1A1A18] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                  >
                    Original Size
                  </button>
                )}
                <button
                  onClick={() => {
                    setCropAspect(1)
                    setZoom(1)
                    setCrop({ x: 0, y: 0 })
                  }}
                  className="px-4 py-3 border border-gray-200 bg-white text-[#1A1A18] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                >
                  1:1 Square
                </button>
                <button
                  onClick={() => {
                    setCropAspect(4/3)
                    setZoom(1)
                    setCrop({ x: 0, y: 0 })
                  }}
                  className="px-4 py-3 border border-gray-200 bg-white text-[#1A1A18] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                >
                  4:3 Ratio
                </button>
                <button
                  onClick={handleConfirmCrop}
                  className="px-6 py-3 bg-[#1A1A18] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-colors"
                >
                  Confirm Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Outfit:wght@200;300;400;500;900&family=Prompt:wght@200;300;400&display=swap');
          .font-serif-luxury { font-family: 'Cormorant Garamond', serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}
